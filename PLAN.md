# PLAN: M8 Production Asset Pipeline — Macro-batch 1
<!-- Live task graph. Keep steps independently verifiable/committable. -->

Input: Product Owner M8 macro-batch 1 | Stack: STACK.md | Contract: docs/architecture/asset-pipeline.md
Task slug: `m8-production-asset-pipeline` (`python3 scripts/leanloop/task.py start m8-production-asset-pipeline`)

## Non-goals

- Character/enemy model replacement, animation retargeting, broad environment art, remote delivery, CMS/editor, generalized registry/database, Git LFS, M9.
- Gameplay authority changes, render-mesh-owned collision, controller work, or rewriting accepted M7 history/tags.

## Steps

- [x] 0. Correct authored checkpoint spawn/visual overlap and close stale M7 documentation
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: checkpoint authored data/runtime projection, focused tests, canonical milestone docs, deprecated Claude-local example
  - verifier: `npm run lint && npm run typecheck && npm run test -- src/game/world/checkpoint.test.ts src/game/character/playerRespawn.integration.test.ts src/physics/connectedLevelAuthoring.test.ts`
  - evidence: PASS; lint/typecheck plus 17 focused checkpoint, respawn, authoring, HUD, and navigation tests.
- [x] 1. Establish the minimum production asset contract and validation boundary
  - depends: 0
  - risk: HIGH
  - isolation: sequential
  - owns/allows: asset architecture doc, source/runtime asset paths, focused validation/import tooling and tests, package scripts
  - verifier: `npm run assets:verify && npm run lint && npm run typecheck`
  - evidence: PASS; asset import/verify, 4 focused contract tests, lint, typecheck, and diff check.
- [x] 2. Replace the checkpoint placeholder through the canonical asset path
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: checkpoint source/runtime asset, checkpoint renderer, focused render/asset tests, provenance record
  - verifier: `npm run assets:verify && npm run test -- src/render/CheckpointVisual.test.tsx src/game/world/checkpoint.test.ts`
  - evidence: PASS; canonical GLTF load projection, actionable missing-asset test, 8 focused tests, lint/typecheck/build.
- [ ] 3. Complete M8 macro-batch verification and durable state
  - depends: 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: browser/runtime gate where available, PLAN/HANDOFF/CHECKPOINT/current-state/REPOMAP, focused fixes only
  - verifier: `npm run verify && git diff --check && python3 scripts/leanloop/doctor.py --strict && python3 scripts/leanloop/sync.py --check`

## Parallel groups

- none — single-writer sequential batch

## Decisions

- 2026-08-11 | M7 acceptance is supported by local tag `v0.7.0-animation-foundation` peeling to HEAD `c93f083`; M8 may start without modifying tag/history.
- 2026-08-11 | Fix checkpoint anchor authority before introducing its production render asset.

## Escalation

- Same error 3 times: persist a stuck report and stop for Product Owner review.
- Stop before later steps if checkpoint, asset, or gameplay authority requires a broad redesign.
