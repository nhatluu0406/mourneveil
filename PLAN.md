# PLAN: M10 Macro-Batch 3 — Modular Content Architecture + Readability Recovery
<!-- Live M10 graph only. -->

Input: Product Owner M10 macro-batch 3 | Stack: `STACK.md` | Contract: `docs/art/visual-direction.md`
Task slug: `m10-visual-production-identity`

## Goal

Replace monolithic ossuary kit authoring with data-driven modular world-object composition, and recover refuge → corridor → first-combat readability without flattening dark-fantasy mood or regressing M10.2 performance/gameplay gates.

## Non-goals

- M11; M10 closure/tag; push; class-heavy inheritance OOP / ECS / DI / plugin registries
- Gameplay/collider/encounter/navigation/save authority changes
- Mixed court / ash walk / final approach expansion
- Texture spam; generalized batching/material frameworks
- Full actor combat/runtime rewrite

## Steps

- [x] 1. Introduce narrow WorldObject definition/placement contracts, immutable registry resolution, and focused pure tests
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/render/world/**` contracts/registry/tests; PLAN/CHECKPOINT
  - verifier: `npm run test -- src/render/world`
- [x] 2. Extract shared ossuary material presets and split reusable object-type modules (architecture/burial/metal/dressing/landmarks)
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/render/world/ossuary/**`, material presets; migrate kit usage
  - verifier: `npm run test -- src/render && npm run lint && npm run typecheck`
- [x] 3. Convert hero route to declarative placements + thin composition renderer; remove duplicate monolithic kit logic
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: route placement data, `OssuaryEnvironmentKit` thin entry, ledger path updates
  - verifier: `npm run test -- src/render src/content/assets`
- [x] 4. Readability recovery: lighting/fog/material value structure for refuge/corridor/combat; actor palette only if needed
  - depends: 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `Scene.tsx`, palette/materials, optional minimal actor contrast; no simulation edits
  - verifier: `KEEP_ARTIFACTS=1 npm run gate:m10-hero-visual`
- [x] 5. Architecture ADR, debt/current-state/HANDOFF, full gates and repository verify
  - depends: 4
  - risk: HIGH
  - isolation: sequential
  - owns/allows: ADR/docs/task state; performance + gameplay gates
  - verifier: `npm run verify && npm run gate:m9-perf-baseline && npm run gate:lifecycle && python3 scripts/leanloop/doctor.py --strict`

## Parallel groups

- None; Product Owner requires Cursor-only single-writer execution.

## Decisions

- 2026-08-12 | Data-driven modular object composition (immutable definitions + placements + typed registry), not class inheritance OOP.
- 2026-08-12 | Render object definitions remain presentation-only; collision/interaction stay world/simulation-owned and link by stable IDs only.
- 2026-08-12 | Instancing stays placement-group-by-definition; no generalized batching engine.
- 2026-08-12 | Actor visuals audited; extract only if they share the environment monolith problem (Oathblade reusable module max).
- 2026-08-12 | Readability uses fill-heavy lighting (higher ambient/hemi, softer key shadows, exposure 1.45) plus lifted material/zone floor values; 9-light ceiling retained.

## Escalation

- Stop if readability requires collider/gameplay changes or renderer ceilings cannot be met without weakening modularity.
- Same failure 3× → persist stuck report and escalate.
