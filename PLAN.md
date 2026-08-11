# PLAN: M8 Production Asset Pipeline — Macro-batch 4 Corrections
<!-- Live task graph. Keep steps independently verifiable/committable. -->

Input: Product Owner M8 macro-batch 4 | Stack: STACK.md | Task: `m8-production-asset-pipeline`

## Non-goals

- Navmesh/A*/behavior trees, new assets, production weapon work, gameplay reach/timing/damage changes, lifecycle redesign, M8 closure/tag, M9, push.

## Steps

- [x] 0. Establish repository and defect truth
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: read-only Git, active state, weapon/render, enemy movement/navigation, physics/tests/gates
  - verifier: clean Git guard; `91152ab` ancestry; M7 tag peel; targeted source/history inspection
  - evidence: clean `main` at `91152ab`, equal to `origin/main`; tag peels to `c93f083`; no unrelated edits.
- [x] 1. Compact the procedural weapon and remove marginal wall-constraint code
  - depends: 0
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/render/PlayerVisual.tsx`, weapon presentation constants/tests, M8 runtime gate
  - verifier: focused player presentation/combat tests plus deterministic wall/pillar screenshots; authoritative contact definition unchanged
  - evidence: PASS; blade reduced 0.95 m → 0.56 m; wall constraint deleted; focused presentation/combat tests and divider/border/pillar screenshots green; live damage remained 70 → 50.
- [x] 2. Add deterministic shared obstacle detours
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: connected navigation state/planner, `GameRuntime` pursuit orchestration, focused pure/Rapier tests
  - verifier: clear/center/offset/corner/release/combat/defeat tests; real Rapier integration; deterministic browser blocker route reaches attack range
  - evidence: PASS; pure planner and real Rapier center/offset/pillar fixtures green; runtime introduction enemy routed around `blocker.first-combat`, released detour, and reached attack range.
- [x] 3. Full verification and durable M8 state
  - depends: 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: active PLAN/HANDOFF/CHECKPOINT/current-state/REPOMAP and STACK only if durable law changes
  - verifier: asset, lint, typecheck, test, build, verify, diff, LeanLoop, browser/runtime, final owned-process audit
  - evidence: PASS; 68 files / 282 tests, production build/assets, owned Playwright gate, diff/doctor/sync, REPOMAP, commit guard and final process/port audit green.

## Decisions

- 2026-08-12 | Prefer a compact fixed placeholder weapon over further wall-aware presentation architecture; gameplay attack authority remains unchanged.
- 2026-08-12 | Use authored solid XZ footprints only to choose short-lived deterministic local detour waypoints; Rapier remains movement/collision authority.

## Escalation

- Same failure three times: persist a stuck report under the active task and stop.
- Stop before broader M8 work if the minimal detour cannot solve a reachable single static blocker without navigation-system expansion.
