# PLAN: M10 Visual Production & Identity — Hero Screenshot Pass
<!-- Live M10 graph only. -->

Input: Product Owner M10 macro-batch 1 | Stack: `STACK.md` | Contract: `docs/art/visual-direction.md`
Task slug: `m10-visual-production-identity`

## Goal

Replace the checkpoint/early-combat hero view’s graybox read with one coherent project-authored dark-fantasy presentation while preserving all gameplay authority and measured browser performance.

## Non-goals

- M11; third-party assets; gameplay retuning; collider changes; animation-driven timing; generalized retargeting, particles, material registry, post-processing, or compression; production audio; controller; push/tag M10.

## Steps

- [x] 1. Lock M10 direction, asset acceptance/budget policy, and baseline evidence
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `docs/art/visual-direction.md`, asset contract/ledger, visual gate, baseline evidence
  - verifier: `npm run assets:verify && npm run gate:m10-hero-visual -- --baseline`
- [x] 2. Build production-candidate Warden + Oathblade and skirmisher projections
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: player/enemy render projection, shared project-authored geometry/material modules, focused render tests
  - verifier: `npm run test -- src/render && npm run gate:m10-hero-visual`
- [x] 3. Build hero-area environment, shrine integration, lighting, VFX, and HUD cohesion
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: scene/world/checkpoint/VFX/UI projection only; explicit physics proxies unchanged
  - verifier: `npm run gate:m10-hero-visual && npm run gate:m9-player-combat`
- [x] 4. Measure production budgets, run gameplay/full gates, and record M10 handoff
  - depends: 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: asset budgets, performance gate, PLAN/HANDOFF/current-state/REPOMAP/debt evidence
  - verifier: `npm run verify && npm run gate:m9-perf-baseline && python3 scripts/leanloop/doctor.py --strict`

## Parallel groups

- None; Product Owner requires one coding writer and ordered screenshot integration.

## Decisions

- 2026-08-12 | M10 replaces the prior roadmap’s Ranged / Magic slot by explicit Product Owner reprioritization; accepted M9 history remains unchanged.
- 2026-08-12 | Visual geometry and animation are presentation-only; existing colliders, contact reach, action timing, and semantic animation state remain authoritative.
- 2026-08-12 | Quality is accepted at the composed 1440×900 hero view, not by asset-load success alone.

## Escalation

- Stop if the visual pass requires gameplay/collider authority changes or cannot remain inside measured renderer budgets.
- Same failure 3× → persist a stuck report and escalate.
