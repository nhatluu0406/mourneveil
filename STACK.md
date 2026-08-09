# STACK
<!-- Project law for agents. Deviation requires editing this file first. Details live in linked docs — do not copy them here. -->

## Identity
- Product: Mourneveil — local-first browser 3D action RPG vertical slice (working title)
- Priority: reliable local vertical slice; no deployment until local hardening is accepted
- Language of record: English (code, identifiers, commits, docs)

## Runtime & tooling
- TypeScript (strict) + React 19 + Vite 8
- Three.js + React Three Fiber + Drei + `@react-three/rapier`
- Tests: Vitest · Lint: ESLint · Package manager: **npm 10.9.2** (lockfile committed)
- Node.js `>=22.12.0 <23` · no env vars / backend / cloud services for the slice
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
- Combat actions: immutable definitions use integer simulation-step durations; one authoritative runtime owns phase transitions and contact-window state; animation may project action state but never advance it
- Player attacks: canvas-owned LMB requests light and Shift+LMB requests heavy on the press edge; accepted attacks freeze semantic world aim into an execution-facing snapshot that drives both presentation orientation and contact-shape orientation, suppress locomotion intent, and expose facing-relative contact-shape data only during the authoritative active window
- Gameplay pointer input belongs only to the canvas surface; UI pointer interaction is excluded, and unreliable surface/focus lifecycle clears held gameplay input
- Defense: Space requests one fixed-step, collision-resolved dodge whose active phase owns invulnerability; held canvas RMB produces simulation-owned guard state and constrained movement
- Melee contact: after fixed-step movement, Rapier may report overlap between the simulation-owned active attack shape and registered gameplay hurtboxes; simulation emits at most one hit per target per deterministic attack execution and owns damage/health outcomes; render and animation never author hits
- Enemy melee authority: immutable definitions own movement and spacing thresholds; fixed-step simulation owns perception, Rapier-resolved pursuit/local steering, explicit spacing state, action phases, outgoing contact, health, and defeat; each accepted attack snapshots authoritative enemy-to-player facing once, and telegraph, presentation, contact, and guard-angle evaluation consume that execution snapshot
- Player recovery authority: canonical player health owns alive/dead and deterministic damage/restore; death clears player action/defense/contact and stops movement while simulation stays live; one authored checkpoint owns the active respawn reference, and simulation-owned respawn restores player state and deterministically resets the mixed encounter; the limited flask is a fixed-step committed action whose active step alone consumes one charge and heals, with checkpoint interaction/respawn refilling charges; provisional Echoes currency is simulation-owned, enemy definitions grant a one-time defeat reward, and death drops carried Echoes into at most one world recovery that proximity pickup restores exactly once (a later death replaces or clears the prior drop; respawn/checkpoint rest never auto-return dropped Echoes); authored item definitions feed a small inventory with weapon+charm equipment slots whose modifiers resolve attack damage and max health through one canonical derivation path; defeated graybox enemies may spawn one authored loot pickup exactly once per encounter lifecycle; SaveFileV1 persists only stable facts (checkpoint, flask charges, Echoes, active recovery, inventory, equipment, loot spawn memory) through a narrow localStorage adapter with version validation and safe fallback — encounter enemies reset on load and transient combat/input/physics state is never serialized
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
- `src/game/combat/` · `src/game/enemies/` · `src/game/encounters/` · `src/game/world/` · `src/game/items/` · `src/game/save/`
- `src/input/` intents · `src/physics/` Rapier adapter · `src/render/` R3F · `src/ui/` · `src/audio/` · `src/content/` · `src/debug/`
- Naming: modules/folders kebab or domain folders; React components `PascalCase.tsx`; pure logic `camelCase.ts`; co-located `*.test.ts`
- Alias: follow existing `tsconfig` paths; no deep `../../..` when an alias exists

## Source of truth
1. Git HEAD + working tree → 2. this file → 3. `PLAN.md` → 4. active LeanLoop task HANDOFF/CHECKPOINT → 5. ADRs → 6. product docs → 7. `docs/development/current-state.md` (milestone summary only) → 8. old reports/chat

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
