# PLAN: M8 Production Asset Pipeline — Macro-batch 2
<!-- Live task graph. Keep steps independently verifiable/committable. -->

Input: Product Owner M8 macro-batch 2 | Stack: STACK.md | Contract: docs/architecture/asset-pipeline.md
Task slug: `m8-production-asset-pipeline` (`python3 scripts/leanloop/task.py start m8-production-asset-pipeline`)

## Non-goals

- Player model replacement, generalized retargeting, Draco/Meshopt/KTX2/Basis, CDN, Git LFS, whole-level art, HUD/palette redesign, M9.
- Closing/tagging M8; rewriting M7 history/tags; render-mesh-owned collision or combat authority.

## Steps

- [x] 0. Macro-batch 1 visual acceptance gate (shrine spawn/rest/respawn)
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: Playwright gate script under `scripts/browser/`, focused shrine/runtime fixes only if defects found
  - verifier: `node scripts/browser/gate-m8-shrine-visual.mjs` with `npm run dev` (HUMAN-VERIFY screenshots + console); automated gate exit 0
  - evidence: PASS; Playwright Chromium available. Spawn clearance 10.4m from shrine visual; Rest prompt/accept; respawn clearance 1.3m at authored anchor; no asset console/network failures. Screenshots under `tmp-m8-shrine/`. No shrine defects requiring code fix.
- [x] 1. Extend production asset contract for GLB + explicit budgets
  - depends: 0
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `docs/architecture/asset-pipeline.md`, `assets/*`, `scripts/assets/*`, STACK asset bullet, focused pipeline tests
  - verifier: `npm run assets:verify && npm run test -- scripts/assets/assetPipeline.test.mjs src/content/assets/productionAssetReference.test.ts`
  - evidence: PASS; GLB+gltf2 formats, texture none-external/embedded-only, animationSemantics, 256KiB/1MiB budgets; 5 pipeline tests + references.
- [x] 2. Author and import one skinned animated skirmisher proof GLB
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: project-authored skirmisher GLB source/runtime, manifest/provenance, clip→semantic mapping module + tests
  - verifier: `npm run assets:import && npm run assets:verify && npm run test -- src/content/assets src/render/animation`
  - evidence: PASS; `enemy.skirmisher.proof` ~13KB GLB; Clip_Skirm_* mapped at asset boundary; import/verify green.
- [x] 3. Integrate skirmisher GLB through M7 animation presentation (render-only)
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `EnemyVisual` / enemy presentation path for skirmisher only, narrow visual fixes, focused render/gameplay tests
  - verifier: `npm run test -- src/render/animation/enemyGltfClipPlayback.test.ts src/render/animation/enemyAnimation.test.ts src/game/enemies src/physics/enemyMovement.integration.test.ts`
  - evidence: PASS; SkirmisherProductionVisual + mixer sync; brute remains procedural; 54 focused enemy/animation tests.
- [x] 4. Full verification + durable M8 state
  - depends: 3
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: PLAN/HANDOFF/current-state/REPOMAP, browser enemy gate when available
  - verifier: `npm run verify && git diff --check && python3 scripts/leanloop/doctor.py --strict && python3 scripts/leanloop/sync.py --check`
  - evidence: PASS; lint/typecheck; 66 files/270 tests; asset-validated build; shrine+skirmisher Playwright gates PASS; doctor/sync PASS.

## Parallel groups

- none — single-writer sequential batch

## Decisions

- 2026-08-11 | Prefer one enemy (skirmisher) animated GLB over player replacement to prove skinned clips + M7 presentation with smaller blast radius.
- 2026-08-11 | Prefer project-authored proof asset over fetching third-party content when no licensed animated asset exists locally.
- 2026-08-11 | Prefer `.glb` as production runtime format; no compression stack without measured need.
- 2026-08-11 | Initial budgets: 256 KiB default per asset / 1 MiB total runtime; proof entries use 64 KiB caps.

## Escalation

- Same error 3 times: persist a stuck report and stop for Product Owner review.
- If no owned/licensed animated asset can be authored with available tooling, stop content selection and report the PO decision while finishing infrastructure that does not depend on it.
