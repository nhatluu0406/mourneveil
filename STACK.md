# STACK
<!-- Project law for agents. Deviation requires editing this file first. Details live in linked docs — do not copy them here. -->

## Identity
- Product: Mourneveil — local-first browser 3D action RPG vertical slice (working title)
- Priority: reliable local vertical slice; no deployment until local hardening is accepted
- Language of record: English (code, identifiers, commits, docs)

## Runtime & tooling
- TypeScript (strict) + React 19 + Vite 8
- Three.js + React Three Fiber + Drei + `@react-three/rapier`
- Tests: Vitest · Lint: ESLint · Package manager: **npm** (lockfile committed)
- Node.js 22 · no env vars / backend / cloud services for the slice
- Stack ADR: `docs/architecture/decisions/0001-web-stack.md`

## Commands (agents use only these)
- install: `npm ci` (or `npm install` for fresh local setup)
- dev: `npm run dev`
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- test: `npm run test`
- build: `npm run build`
- verify: `npm run verify` (lint → typecheck → test → build)

## Authority & flow
- Graybox locomotion: the fixed-step player motor proposes kinematic displacement; Rapier's character controller exclusively resolves collision and grounding with a 2 cm contact offset, 10 cm ground snap, and 45 degree walkable-slope limit
- Simulation time: fixed 60 Hz; clamp frame delta to 250 ms; run at most 8 catch-up steps per frame; discard excess whole-step backlog and preserve only a fractional-step remainder
- Combat actions: immutable definitions use integer simulation-step durations; one authoritative runtime owns phase transitions and contact-window state; animation may project action state but never advance it
- Player attacks: canvas-owned LMB requests light and Shift+LMB requests heavy on the press edge; accepted attacks snapshot semantic world aim for the execution, suppress locomotion intent, and expose facing-relative contact-shape data only during the authoritative active window
- Gameplay pointer input belongs only to the canvas surface; UI pointer interaction is excluded, and unreliable surface/focus lifecycle clears held gameplay input
- Defense: Space requests one fixed-step, collision-resolved dodge whose active phase owns invulnerability; held canvas RMB produces simulation-owned guard state and constrained movement
- Melee contact: after fixed-step movement, Rapier may report overlap between the simulation-owned active attack shape and registered gameplay hurtboxes; simulation emits at most one hit per target per deterministic attack execution and owns damage/health outcomes; render and animation never author hits
- React is shell/UI projection — not combat/simulation authority
- Flow: device input → intents → simulation resolves outcomes → render/UI/audio/VFX consume typed state/events
- Physics reports collision facts; simulation assigns gameplay meaning
- Authored definitions immutable; runtime entities hold instance state
- Prefer explicit module contracts over a global event bus or shared mutable store
- No ECS, custom engine, backend, multiplayer, procedural world, or deployment platform in the initial slice unless an accepted ADR authorizes it
- Product/architecture contracts: `docs/product/`, `docs/architecture/`

## Module ownership (create only when a milestone needs the path)
- `src/app/` bootstrap · `src/game/core/` sim clock/contracts/events · `src/game/character/` player
- `src/game/combat/` · `src/game/enemies/` · `src/game/encounters/` · `src/game/world/` · `src/game/items/` · `src/game/save/`
- `src/input/` intents · `src/physics/` Rapier adapter · `src/render/` R3F · `src/ui/` · `src/audio/` · `src/content/` · `src/debug/`
- Naming: modules/folders kebab or domain folders; React components `PascalCase.tsx`; pure logic `camelCase.ts`; co-located `*.test.ts`
- Alias: follow existing `tsconfig` paths; no deep `../../..` when an alias exists

## Source of truth
1. Git HEAD + working tree → 2. this file → 3. `PLAN.md` → 4. active LeanLoop task HANDOFF/CHECKPOINT → 5. ADRs → 6. product docs → 7. `docs/development/current-state.md` (milestone summary only) → 8. old reports/chat

## Agent routing
- **Codex**: core/high-risk architecture, simulation authority, cross-module integration
- **Cursor**: scoped implementation, camera/HUD/runtime iteration under stable contracts
- **Claude**: independent review, analysis, skill/doc critique (read-only unless asked to implement)
- Single-writer: one coding agent per working tree; parallel work requires separate Git worktrees/branches

## Git safety
- No push/merge/history rewrite/branch delete unless the task explicitly authorizes it
- Commit only via explicit paths (`python3 scripts/leanloop/safe_commit.py`); never `git add .`
- Conventional Commits; never stage secrets; preserve unrelated user changes
- Dirty main tree → isolate with `python3 scripts/leanloop/worktree.py create <slug>`

## Verification baseline
- Pure-logic tests for changed simulation/input rules · `npm run verify` · `git diff --check`
- Gameplay/visual changes also need a recorded local runtime check with a deterministic reproduction path
- Product Owner runtime observations outrank an automated “works” claim
