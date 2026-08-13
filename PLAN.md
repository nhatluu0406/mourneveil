# PLAN: M15 Presentation, Motion & Scene Readability — Macro-batch 3
<!-- Live M15 graph only. -->

Input: Product Owner M15 MB3 world-integrity brief | Stack: `STACK.md`
Task slug: `m15-presentation-motion-scene-readability`
Agent: Cursor only

## Goal

One canonical authored dungeon compiles to render, collision, nav, lights, and interactions. Player and enemy cannot cross visible walls. Continue vs New Rite is explicit. Armory and Oath are separate views. Do not close or tag M15. Do not start M16. No Codex art.

## Non-goals

- M15 closure, tags, push, or M16
- New production meshes/materials/VFX
- Procedural roguelike / ECS / inheritance trees
- Rewriting simulation combat/save schema versions
- Invisible gameplay volumes unless proven necessary

## Steps

- [x] 1. Canonical dungeon + object modules + pure compiler
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/content/world/**`, ADR-0004, object catalog, room modules, compileDungeon; render re-exports
  - verifier: `npx vitest run src/content/world`
- [x] 2. Derive physics from compiled dungeon; delete handwritten wall map
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/physics/connectedLevelCollision.ts`, Rapier tests, integrity audit, enemy/player wall tests
  - verifier: `npx vitest run src/content/world src/physics src/render/world/ossuary`
- [x] 3. Session semantics: Continue / New Rite / ?fresh=1 / defeated boss
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/app/`, `src/game/save/`, boss presentation, gate helper
  - verifier: `npx vitest run src/app src/game/save src/game/enemies/bossFoundation.test.ts src/render/boss`
- [x] 4. Armory / Oath information architecture
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/ui/**`, `src/app/styles.css`
  - verifier: `npx vitest run src/ui`
- [x] 5. Actor modules, dead-code removal, gates, docs, MB3 handoff
  - depends: 1, 2, 3, 4
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: actor folders, gates, STACK/HANDOFF/current-state/roadmap, ADR
  - verifier: `npm run verify` plus listed M15/regression gates

## Parallel groups

- none (single-writer main tree)

## Locked decisions (keep MB1/MB2)

- Fixed 60 Hz simulation. Rapier on authoritative transforms. Camera follows interpolated player.
- Static architecture opaque. Fade only `gate.shortcut` / `gate.final`.
- Camera-near edges: low parapets. Far edges: tall. No roof.
- Locomotion gait is presentation-only and distance-driven.
- No class-inheritance object framework (ADR-0002).

## Locked decisions (MB3)

- Structural objects are never authored independently in render and physics.
- Hierarchy: DUNGEON → ROOM → OBJECT INSTANCES → OBJECT TYPE CATALOG → render/collision/light/interaction.
- Instance ≠ type. One module per reusable type; dungeon owns placements.
- Production room files must not create `<mesh>`, `<pointLight>`, or `<CuboidCollider>`.
- `CONNECTED_LEVEL_COLLIDERS` is derived from `compileDungeon` or removed.
- Title screen resolves session intent before `GameRuntime` construction. `?fresh=1` starts a new rite.
- Reload with a save shows Continue/New Rite; Continue loads canonical save.

## Escalation

- Gameplay/save schema version bump → stop unless required for session reset.
- Same failure 3× → stuck report + stop.
