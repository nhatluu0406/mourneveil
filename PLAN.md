# PLAN: M8 Production Asset Pipeline — Macro-batch 3 Stabilization
<!-- Live task graph. Keep steps independently verifiable/committable. -->

Input: Product Owner M8 macro-batch 3 | Stack: STACK.md | Contracts: `docs/architecture/animation-presentation.md`, `docs/architecture/asset-pipeline.md`
Task slug: `m8-production-asset-pipeline` (`python3 scripts/leanloop/task.py start m8-production-asset-pipeline`)

## Non-goals

- New actor/prop assets, player replacement, third-party art, IK/retargeting, physics weapons, broad presentation redesign, generalized process supervision, M9.
- Closing/tagging M8, pushing, changing combat/contact authority, or deleting the accepted GLB pipeline proof.

## Steps

- [x] 0. Establish truth, reproduce defects, and clean only proven stale Mourneveil processes
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: read-only Git/history/process/browser audit; PLAN and active CHECKPOINT
  - verifier: ancestry/tag/upstream evidence; scoped PID command-line + port evidence; deterministic runtime screenshots when browser control is available
  - evidence: PASS; clean `main` at `ac0c385` equaled origin; M7 tag peeled to `c93f083`; verified Mourneveil Vite PID 52044 stopped and port 4173 released; ambiguous npm PID 61176 left untouched.
- [x] 1. Constrain held-weapon presentation near authored solids
  - depends: 0
  - risk: HIGH
  - isolation: sequential
  - owns/allows: player render/presentation helpers and focused tests; read-only authored collider projection
  - verifier: `npm run test -- src/render/playerWeaponWallConstraint.test.ts src/render/playerAttackPresentation.test.ts src/render/PlayerVisual.test.ts src/physics/playerCollision.integration.test.ts src/physics/combatOcclusion.integration.test.ts`
  - evidence: PASS; render-only authored-solid blade constraint; 5 focused files / 16 tests; divider and border idle/locomotion/attack/clear screenshots show no tested penetration; player capsule/contact authority unchanged.
- [x] 2. Restore accepted procedural skirmisher in gameplay while retaining isolated GLB proof
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: enemy render/backend selection, proof fixture/gate, asset docs/tests
  - verifier: `npm run assets:verify && npm run test -- src/render/enemyPresentationRoles.test.ts src/render/animation/enemyGltfClipPlayback.test.ts src/render/animation/enemyAnimation.test.ts src/content/assets/productionAssetReference.test.ts`
  - evidence: PASS; prior procedural renderer restored by default; proof GLB retained behind explicit development query; default gate made no proof-GLB request; isolated proof gate exercised startup/defeat.
- [x] 3. Add owned browser/runtime lifecycle and success/failure cleanup proof
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `scripts/browser/` shared lifecycle + M8 gates, package scripts, focused lifecycle tests
  - verifier: `npm run test -- scripts/browser/runtimeGateLifecycle.test.mjs && npm run gate:lifecycle && npm run gate:m8-stabilization`
  - evidence: PASS; unit child-port cleanup; real Vite + Playwright success and intentional-failure cleanup; M8 gates own server/browser; ports 4173/4191/4192 reusable.
- [x] 4. Full verification and durable M8 stabilization state
  - depends: 3
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: PLAN/HANDOFF/current-state/REPOMAP/STACK only if durable law changes
  - verifier: `npm run verify && git diff --check && python3 scripts/leanloop/doctor.py --strict && python3 scripts/leanloop/sync.py --check && python3 scripts/leanloop/git_guard.py`
  - evidence: PASS; 68 files / 276 tests; lint/typecheck/build; focused 69 tests; assets import/verify; browser gates; diff/LeanLoop gates green.

## Parallel groups

- none — Product Owner requires Codex-only single-writer sequential work

## Decisions

- 2026-08-11 | Treat the PO-rejected skirmisher GLB as a retained technical proof, not default playable presentation.
- 2026-08-11 | Presentation may read authored solid geometry to constrain visible weapon reach; combat contacts and timing remain unchanged.
- 2026-08-11 | Active M8 browser gates own one direct Vite child plus their Playwright page/context/browser and clean them in one idempotent `finally` boundary.

## Escalation

- Same error 3 times: persist a stuck report under the active task and stop for Product Owner review.
- If wall-aware presentation requires gameplay/contact changes or reliable Windows scoped teardown cannot be proven, stop M8 expansion and report the architecture blocker.
