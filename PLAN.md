# PLAN: M11 Boss Vertical Slice — Final Hardening + Closure Readiness
<!-- Live M11 graph only. -->

Input: MB2 ending HEAD `3f7bd1f` (PO visual direction ACCEPTED) | Stack: `STACK.md`
Task slug: `m11-boss-vertical-slice`
Agent: Cursor only

## Goal

Technical integration hardening, boss-room performance audit/consolidation, camera/occlusion regression, canonical Node/npm verification, and M11 closure readiness. No M12. No speculative art pass.

## Non-goals

- M11 tag/push; M12 implementation
- Boss art redesign; HUD redesign; second camera system
- Returning blindly to M10 budgets; triangle chasing
- Broad route polish outside boss room

## Steps

- [x] 1. Boss gameplay contract + attack reachability proof
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/game/enemies/bossPolicy*`, focused pure tests; no authority redesign
  - verifier: `npx vitest run src/game/enemies/bossPolicy.test.ts src/game/enemies/bossFoundation.test.ts`
- [x] 2. Presentation sync + readability/camera/HUD technical audit
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: boss VFX/presentation projection, HUD reads, smallest technical readability fix only if defect proven
  - verifier: `npx vitest run src/render/boss src/ui && npm run gate:m11-boss-visual`
- [x] 3. Boss-room performance audit, consolidation, soak, budgets
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: shared geometry/materials/conditional cue mounts; gate ceilings with safety margin; soak proof
  - verifier: `npm run gate:m11-boss-visual && npm run gate:m10-perf-baseline`
- [x] 4. Canonical full M11 closure gate + docs
  - depends: 1, 2, 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: HANDOFF, DEBT (evidence-only), current-state, PLAN tick
  - verifier: focused tests + M11/M10/M9 gates + lifecycle + assets + `npm run verify` + LeanLoop doctor/sync/git_guard

## Decisions

- Product Owner ACCEPTED MB2 visual direction; no further broad art pass in M11.
- Canonical verification requires Node 22.x and npm 10.9.x (verified on 22.22.1 / 10.9.2).
- ~350 boss draw calls are largely justified (full route + fixtures + boss); consolidation targeted mesh/object/material waste.
- Report `M11 READY FOR PRODUCT OWNER ACCEPTANCE — FINAL` when all acceptance criteria are green.

## Escalation

- Same failure 3× → stuck report and escalate.
- Any required gameplay-authority redesign stops for review.
