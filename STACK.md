# STACK
<!-- Project law for agents. Deviation requires editing this file first. Details live in linked docs — do not copy them here. -->

## Identity
- Product: Mourneveil — local-first browser 3D action RPG vertical slice (working title)
- Priority: evolve a reliable local vertical slice through the long-running pre-1.0 roadmap; deployment remains deferred until release-quality milestones
- Language of record: English (code, identifiers, commits, docs)

## Runtime & tooling
- TypeScript (strict) + React 19 + Vite 8
- Three.js + React Three Fiber + Drei + `@react-three/rapier`
- Tests: Vitest · Lint: ESLint · Package manager: **npm 10.9.2** (lockfile committed)
- Node.js `>=22.12.0 <23` · no env vars / backend / cloud services for the slice
- Browser/runtime gates that start Vite or Playwright own those exact process handles and close them through an idempotent `finally` boundary on pass, failure, timeout, or signal; an already-absent owned POSIX process group (`ESRCH`) is successful teardown while other signal errors remain fatal; Windows forced cleanup may target only the recorded owned PID tree, never arbitrary Node processes or port owners; screenshot/evidence dirs must be an owned `tmp-m*` folder passed as `artifactDir` and removed in that same `finally` unless `KEEP_ARTIFACTS=1`
- Stack ADR: `docs/architecture/decisions/0001-web-stack.md`

## Commands (agents use only these)
- install: `npx --yes npm@10.9.2 ci`
- dev: `npm run dev` → `http://127.0.0.1:4173/` (host/port pinned in `vite.config.ts`)
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- test: `npm run test`
- build: `npm run build`
- verify: `npm run verify` (lint → typecheck → test → build)
- CI: current official checkout/setup-node actions → Node.js 22 → npm 10.9.2 → `npm ci` → `npm run verify` (`.github/workflows/ci.yml`)

## Authority & flow
- Graybox locomotion: the fixed-step player motor proposes kinematic displacement; Rapier's character controller exclusively resolves collision and grounding with a 2 cm contact offset, 10 cm ground snap, and 45 degree walkable-slope limit
- Simulation time: fixed 60 Hz; clamp frame delta to 250 ms; run at most 8 catch-up steps per frame; discard excess whole-step backlog and preserve only a fractional-step remainder
- Presentation time: render interpolates previous→current simulation transforms with alpha = accumulator / fixed step; Rapier colliders and character controller stay on the current simulation transform; the follow camera targets the same interpolated player position the mesh uses; hit impulse is a separate vertical trauma offset and does not rewrite the follow look target; player locomotion gait is presentation-only and advances from travelled planar distance (idle/blocked → gait delta 0)
- Simulation and R3F keep separate rAF loops; presentation sampling happens in the render loop against the latest simulation snapshot
- Room composition: authored rectangular rooms (ADR-0003) generate structural shells before dressing; ADR-0002 registry instantiates placements; gameplay topology stays in `connectedLevel` / collision
- Occlusion: static architecture stays opaque; only `gate.shortcut` and `gate.final` may fade. Camera-near room edges (east/+X, north/+Z) use low parapets instead of transparency
- Grounding: ordinary world placements must be floor, wall, hanging-with-support, or structural; only explicit VFX may float
- Simulation and R3F keep separate rAF loops; presentation sampling happens in the render loop against the latest simulation snapshot
- Combat actions: immutable definitions use integer simulation-step durations; one authoritative runtime owns phase transitions and contact-window state; animation may project action state but never advance it
- Animation authority: fixed-step gameplay snapshots derive a typed backend-neutral `AnimationPresentationState`; procedural poses and future in-place GLTF clips may blend or emit presentation-only markers, but animation/root motion must never move authoritative transforms or decide contact, damage, dodge invulnerability, movement completion, or action transitions
- Production asset authority: editable glTF/GLB sources live under `assets/source`, validated committed runtime imports under `public/assets`, and typed runtime references use stable `/assets/...` URLs; M8 supports embedded `.gltf` and preferred `.glb` in meters, Y-up, ground-centered, with provenance/license, optional animation-semantic clip maps, and explicit byte budgets in `assets/production-assets.json`; textures stay `none-external`/`embedded-only` for now; render meshes never author physics, which remains an explicit world-owned proxy
- Production visual authority: project-authored code-native geometry is allowed where M10 benefits from custom silhouettes; each default production candidate has a stable ID/provenance record in `productionVisualLedger.ts`, stays presentation-only, and is measured by the deterministic 1440×900 hero renderer gate; imported binary assets continue through the M8 source/runtime manifest and byte budgets; modular world objects follow ADR-0002 under ADR-0003 room composition (rooms → placements → registry; no class-inheritance object framework)
- Player attacks: canvas-owned LMB requests light and Shift+LMB requests heavy on the press edge; accepted attacks freeze semantic world aim into an execution-facing snapshot that drives both presentation orientation and contact-shape orientation, suppress locomotion intent during startup/active with partial recovery movement scale 0.35, and expose facing-relative contact-shape data only during the authoritative active window; authored attack steps are light 10/5/16 and heavy 18/8/38; outgoing hit confirmation (material/camera/HUD) projects authoritative contact outcomes with hierarchy miss < light < heavy < interrupt < defeat and per-execution dedup
- Gameplay pointer input belongs only to the canvas surface; UI pointer interaction is excluded, and unreliable surface/focus lifecycle clears held gameplay input
- Defense: Space requests one fixed-step, collision-resolved dodge whose active phase owns invulnerability; held canvas RMB produces simulation-owned guard state and constrained movement; guarded enemy contacts inside the authored 120-degree frontal cone add role-authored impact after per-execution dedup, partial impact resets after 180 quiet steps, threshold 3 causes a transient 72-step guard break, and death/respawn/save restoration clear this unsaved state
- Melee contact: after fixed-step movement, Rapier may report overlap between the simulation-owned active attack shape and registered gameplay hurtboxes; each overlap candidate must also clear a narrow solid-world occlusion probe (fixed world colliders only; sensors and character bodies ignored) from the authoritative attack origin to the target hurtbox before a HitEvent may emit; simulation emits at most one hit per target per deterministic attack execution and owns damage/health outcomes; render and animation never author hits or occlusion
- Enemy melee authority: immutable definitions own movement and spacing thresholds; fixed-step simulation owns perception, Rapier-resolved pursuit/local steering, authored connected-level route anchors when direct pursuit is blocked, explicit spacing state, action phases, outgoing contact, health, defeat, and a narrow heavy-hit interrupt into transient `hitReaction` (light impact 0 / heavy impact 1; skirmisher threshold 1 / brute threshold 2; attack active committed and non-interruptible; 20-step reaction with 12-step post-immunity; unsaved); each accepted attack snapshots authoritative enemy-to-player facing once, and telegraph, presentation, contact, and guard-angle evaluation consume that execution snapshot
- Enemy attack readability: authored phase durations remain simulation-owned (skirmisher 20/10/24, brute 48/12/48 startup/active/recovery); presentation projects phase-only telegraph/recovery cues, emissive accents, and procedural wind-up/recover poses without animation-driven contact or a separate punish state — recovery itself is the punish window and blocks reattack until idle
- Player recovery authority: canonical player health owns alive/dead and deterministic damage/restore; death clears player action/defense/contact and stops movement while simulation stays live; one authored checkpoint owns the active respawn reference, and simulation-owned respawn restores player state and deterministically resets the mixed encounter; the limited flask is a fixed-step committed action whose active step alone consumes one charge and heals (heal amount composes with equipment `flaskHealBonus`), with checkpoint interaction/respawn refilling charges; provisional Echoes currency is simulation-owned, enemy definitions grant a one-time defeat reward, and death drops carried Echoes into at most one world recovery that proximity pickup restores exactly once (a later death replaces or clears the prior drop; respawn/checkpoint rest never auto-return dropped Echoes); authored item definitions feed a small inventory with weapon+charm equipment slots only; durable progression (XP/level 1–5, Vitality/Resolve/Might points) composes with equipment through one authoritative `resolvePlayerCombatStats` path for max health, guard threshold, and melee damage — combat never reads raw level/equipment switches; equipment also contributes typed `activeSkillCooldownStepDelta` and `flaskHealBonus` through the same resolved-modifier path; authored loot tables resolve deterministically (first unowned unique, else Echoes); duplicate unique pickup grants Echoes; one equipped active skill (Veil Step / Oath Cleave / Ward Pulse) unlocks by level, activates only from combat idle while not guarding, and uses simulation-owned cooldown/timing/contact/effects — Q requests activation; SaveFileV4 persists stable player/item/world/progression facts plus equipped skill id (not derived combat stats, not skill cooldown/activation) through a narrow localStorage adapter, with explicit V1–V3 migration and safe malformed/unknown-version fallback — current zone, encounter enemies, and transient combat/input/physics/skill cooldown state are never serialized; death does not reset XP/level/allocation or equipped skill, but clears transient skill cooldown via combat reset
- Connected-world authority: one immutable authored level owns stable zone IDs, bounds, entry references, and explicit open/gated/shortcut connections; a narrow simulation runtime owns current-zone projection and persistent world flags without duplicating checkpoint or encounter state
- Connected-level session policy: semantic F interaction activates/rests the single refuge checkpoint or opens the one shortcut from its authored far side; checkpoint rest and death/respawn recreate enemy action/contact/navigation state and clear encounter activation; opened shortcuts persist; Echoes are granted only by fresh defeats, and collected loot-source memory persists; the final gate opens persistently only after all authored encounters are complete and the player reaches it
- Connected-level encounter activation: authored encounters start inactive; entering an encounter zone activates it until reset; inactive enemies neither perceive nor attack; activated enemies only pursue/attack while the player remains inside that zone plus a small egress margin
- Connected-level collision: authored primitive box data projects the floor, perimeter, choke, sparse blockers, shortcut gate, and final gate into fixed Rapier colliders; gate colliders are present exactly while their simulation-owned world flags are closed; enemy pursuit uses direct motion when clear, short-lived deterministic corner detours around blocking authored footprints, and immutable route anchors across zone connections — Rapier still resolves every movement step; no navmesh or A* engine
- React is shell/UI projection — not combat/simulation authority
- Flow: device input → intents → simulation resolves outcomes → render/UI/audio/VFX consume typed state/events
- Application integration → `game/runtime` session coordinator → player/combat/enemy/encounter/world/item/save domain runtimes
- Physics reports collision facts; simulation assigns gameplay meaning
- Authored definitions immutable; runtime entities hold instance state
- Prefer explicit module contracts over a global event bus or shared mutable store
- No ECS, custom engine, backend, multiplayer, procedural world, or deployment platform in the initial slice unless an accepted ADR authorizes it
- Product/architecture contracts: `docs/product/`, `docs/architecture/`

## Module ownership (create only when a milestone needs the path)
- `src/app/` bootstrap/browser integration · `src/game/runtime/` game/session orchestration · `src/game/core/` low-level simulation clock/contracts/events · `src/game/character/` player
- `src/game/combat/` · `src/game/skills/` · `src/game/enemies/` · `src/game/encounters/` · `src/game/world/` · `src/game/items/` · `src/game/save/`
- `src/input/` intents · `src/physics/` Rapier adapter · `src/render/` R3F · `src/ui/` · `src/audio/` · `src/content/` · `src/debug/`
- Naming: modules/folders kebab or domain folders; React components `PascalCase.tsx`; pure logic `camelCase.ts`; co-located `*.test.ts`
- Alias: follow existing `tsconfig` paths; no deep `../../..` when an alias exists

## Source of truth
1. Git HEAD + working tree → 2. this file → 3. `PLAN.md` (active milestone/task execution graph **only**) → 4. active LeanLoop task HANDOFF/CHECKPOINT → 5. ADRs → 6. product docs / directional roadmap → 7. `docs/development/current-state.md` (milestone summary only) → 8. historical HANDOFFs / Git history / tags

`PLAN.md` must not accumulate closed-milestone graphs. Durable history lives in `state/tasks/*/HANDOFF.md`, `docs/roadmap.md`, Git history, and release tags.

## Agent routing
- **Codex**: strategic use for high-risk gameplay/simulation/save architecture and difficult cross-module integration
- **Cursor**: medium-risk and stable-contract implementation, macro-batches, browser verification, UI/content, scoped refactors, and repository maintenance; strong models may own explicit high-risk contracts
- **Claude**: deferred from the normal workflow; compatibility files remain for tooling, but Claude is not a required reviewer
- Single-writer: one coding agent per working tree; parallel work requires separate Git worktrees/branches

## Git safety
- No push/merge/history rewrite/branch delete unless the task explicitly authorizes it
- Commit only via explicit paths (`python3 scripts/leanloop/safe_commit.py`); never `git add .`
- Conventional Commits; never stage secrets; preserve unrelated user changes
- Direct work on clean `main` is normal for the authorized solo workflow
- Dirty main tree → isolate with `python3 scripts/leanloop/worktree.py create <slug>`

## Verification baseline
- Pure-logic tests for changed simulation/input rules · `npm run verify` · `git diff --check`
- Gameplay/visual changes also need a recorded local runtime check with a deterministic reproduction path
- Product Owner runtime observations outrank an automated “works” claim
