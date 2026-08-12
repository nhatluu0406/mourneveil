# PLAN: M10 Visual Production & Identity — Ossuary Environment Production Slice
<!-- Live M10 graph only. -->

Input: Product Owner M10 macro-batch 2 | Stack: `STACK.md` | Contract: `docs/art/visual-direction.md`
Task slug: `m10-visual-production-identity`

## Goal

Turn the playable refuge → traversal corridor → first-combat route into a readable ruined-gothic ossuary environment while retaining simple authoritative colliders and measured runtime performance.

## Non-goals

- M11; M10 closure/tag; gameplay, collider, encounter, navigation, or save changes; actor rebuild; third-party assets/textures; texture-heavy workflow; generalized particles, renderer, batching, or material registry; HUD redesign; push.

## Steps

- [x] 1. Baseline and lock the render-only route composition contract
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: M10 visual gate evidence, route composition data/tests, PLAN/CHECKPOINT
  - verifier: `npm run gate:m10-hero-visual -- --baseline && npm run test -- src/render`
- [x] 2. Expand the reusable ossuary architecture, burial, metal, and dressing kit
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/render/OssuaryEnvironmentKit.tsx`, shared geometry/palette, ledger and focused tests; no physics authoring
  - verifier: `npm run test -- src/render && npm run lint && npm run typecheck`
- [x] 3. Compose refuge, corridor, first-combat space, landmarks, gates, lighting, and atmosphere
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: connected-level/checkpoint/scene presentation and deterministic hero gate; authoritative colliders unchanged
  - verifier: `npm run gate:m10-hero-visual && npm run gate:m8-stabilization && npm run gate:m9-player-combat`
- [x] 4. Measure performance/growth, run full gameplay and repository gates, and record handoff
  - depends: 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: gate budgets/evidence, visual direction, HANDOFF/CHECKPOINT/current-state/REPOMAP/debt evidence
  - verifier: `npm run verify && npm run gate:m9-perf-baseline && npm run gate:lifecycle && python3 scripts/leanloop/doctor.py --strict`

## Parallel groups

- None; Product Owner requires Codex-only single-writer execution.

## Decisions

- 2026-08-12 | Collider-matched cuboids remain gameplay authority; the richer shell is non-blocking projection and may extend around, but never narrow, the readable route.
- 2026-08-12 | Repeated kit pieces share geometries/material parameters and use instancing where multiplicative; no authored textures unless geometry/material composition fails the visual gate.
- 2026-08-12 | Visual acceptance is based on seven inspected 1440×900 route frames plus unchanged gameplay gates, not geometry count alone.

## Escalation

- Stop if route readability requires collider/gameplay changes or renderer ceilings cannot be met without weakening the requested composition.
- Same failure 3× → persist a stuck report and escalate.
