# PLAN: M15 Presentation, Motion & Scene Readability — Macro-batch 4
<!-- Live M15 graph only. -->

Input: Product Owner M15 MB4 visual-reset brief | Stack: `STACK.md`
Task slug: `m15-presentation-motion-scene-readability`
Agent: Codex, single writer

## Goal

Rebuild Rite I as one readable funerary dungeon complex, redesign procedural actor silhouettes and locomotion projection, and lower render cost without changing gameplay, physics, save, loot, progression, or combat authority. M15 remains active.

## Non-goals

- M15 closure/tag/push, M16, gameplay-speed tuning, or physics/controller rewrites
- Combat, enemy-AI, damage, loot, progression, or save changes
- Root motion, animation-driven actions, transparency-based architecture occlusion
- Prop-count inflation, per-fixture PointLights, navmesh, or production asset downloads

## Steps

- [x] 1. Baseline evidence and canonical macro-envelope
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/content/world/dungeons/ossuary/**`, object definitions/catalog, compiler tests, existing collider metadata
  - outcome: one continuous foundation/exterior perimeter with interior partitions; logical room IDs/topology/anchors preserved; hard/soft/VFX classifications explicit
  - verifier: `npx vitest run src/content/world src/physics/connectedLevelCollision.test.ts` + `npm run gate:m15-world-integrity` + `npm run gate:m15-room-architecture`
- [ ] 2. Architectural art, scale reset, light/shadow policy
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: modular object types, `src/render/world/**`, `src/render/Scene.tsx`, art/STACK decisions
  - outcome: grounded doorway/arch language, restrained landmarks, 3–5 practical PointLights, actor/major-enemy-only dynamic shadows, normal instanced frustum culling
  - verifier: focused world/render tests + `npm run gate:m15-occlusion` + `npm run gate:m15-quality-audit`
- [ ] 3. Warden and enemy silhouette/rig redesign
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/render/actors/**`, `PlayerVisual`, `EnemyVisual`, boss presentation modules, shared actor materials/geometries
  - outcome: articulated player rig and role-readable enemies/boss, presentation-only and collider-neutral
  - verifier: focused actor/animation tests + M11 boss regression gate
- [ ] 4. Distance-driven locomotion presentation
  - depends: 3
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: presentation animation modules/tests and visual refs only
  - outcome: contact/down/passing/up gait, eased start/stop, articulated feet/knees/arms/pelvis; enemy stepping; no root motion or speed changes
  - verifier: `npx vitest run src/render/animation src/render/PlayerVisual.test.ts` + `npm run gate:m15-motion-quality`
- [ ] 5. Render consolidation, evidence, regressions, handoff
  - depends: 1–4
  - risk: HIGH
  - isolation: sequential
  - owns/allows: composer/fixtures/metrics, M15 art gate, package scripts, PLAN/HANDOFF/CHECKPOINT/current-state/REPOMAP
  - outcome: <=170 ordinary draw calls target without hiding essential content; <=30k triangles, <=330 objects, <=200 meshes where achievable; same-scene evidence and honest GPU availability
  - verifier: all required M15/M14/M13/M12/M11/M10/lifecycle/assets gates + `npm run verify` + LeanLoop checks

## Locked decisions

- `OssuaryDungeon` remains canonical; rooms own WHAT/WHERE, object modules own HOW, compiler derives render/collision/light.
- Gameplay topology, encounters, checkpoint, shortcut, final gate, boss sequence, combat, movement speed, and physics authority remain unchanged.
- Simulation/root translation remains authoritative; distance drives presentation gait only.
- Ordinary architecture is opaque and camera-safe by authored scale/placement; only gameplay gates may fade.
- Reusable new object types live under `src/content/world/objects/`; touched legacy types migrate from `remaining.ts` when practical.
- Same failure three times stops the batch with a persisted blocker.
