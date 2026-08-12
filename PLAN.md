# PLAN: M10 Macro-Batch 4 — Cinematic Pass Integration + Hardening
<!-- Live M10 graph only. -->

Input: Product Owner MB4 cinematic integration | Stack: `STACK.md` | Contract: `docs/art/visual-direction.md` + ADR-0002
Task slug: `m10-visual-production-identity`

## Goal

Make the committed cinematic presentation pass (`d7aa44b`) build-clean, runtime-state-bound, responsive, performant, and safe against gameplay regressions without reverting the new visual direction.

## Non-goals

- M11; M10 closure/tag; push
- Reverting/simplifying the cinematic pass to satisfy stale selectors
- Class/OOP rewrite; ECS; WebGPU; LOD; global postprocessing; texture pipeline
- Historical gate modernization unless required by current verification
- Mixed court / ash walk / final approach expansion

## Steps

- [x] 1. Baseline: classify cinematic diff; run lint/typecheck/test/build; fix compile/test regressions without wholesale revert
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: UI/render/test/gate files touched by `d7aa44b` and their stale consumers
  - verifier: `npm run lint && npm run typecheck && npm run test && npm run build`
- [x] 2. HUD hardening: authoritative snapshot bindings, responsive layout, product vs F3/dev diagnostics
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/ui/**`, App shell diagnostics gating, focused UI tests
  - verifier: `npm run test -- src/ui && npm run lint && npm run typecheck`
- [x] 3. Runtime visual/VFX/actor/checkpoint hardening + low-risk perf fixes; preserve ADR-0002
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: Scene/App renderer, palette/materials, actors/VFX/checkpoint presentation only
  - verifier: `KEEP_ARTIFACTS=1 npm run gate:m10-hero-visual && npm run gate:m9-perf-baseline`
- [x] 4. Update M10 visual gate to product presentation + one 1280×720 UI check; full gameplay/repo verify; HANDOFF
  - depends: 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: browser gates, PLAN/HANDOFF/current-state/DEBT as needed
  - verifier: `npm run verify && npm run gate:m8-stabilization && npm run gate:lifecycle && python3 scripts/leanloop/doctor.py --strict`

## Parallel groups

- None; Cursor-only single-writer.

## Decisions

- 2026-08-12 | Prefer updating gates/tests to the new product HUD over reverting presentation.
- 2026-08-12 | Gameplay numbers must bind to GameRuntimeSnapshot; decorative labels may be presentation-only.
- 2026-08-12 | Default visual gates exercise product presentation; F3/dev diagnostics stay gated (no persistent F3 hint).
- 2026-08-12 | Cinematic cost accepted within M10 ceilings (≈256 draw calls / 36k tris / 11 programs); no feature strip for micro-benchmarks.
- 2026-08-12 | Compact HUD collapses decorative panels and right-aligns the action dock ≤1400px to prevent status overlap.

## Escalation

- Same failure 3× → stuck report and escalate.
- Stop if fixing requires simulation authority changes or undoing ADR-0002.
