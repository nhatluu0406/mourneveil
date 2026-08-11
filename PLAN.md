# PLAN: M9 Combat Depth — Telegraph + Punish Window Readability
<!-- Live M9 graph only. -->

Input: Product Owner M9 macro-batch 3 | Stack: `STACK.md` | Task: `m9-combat-depth`

## Goal

Make enemy attack startup / active / recovery visually readable and create a perceivable punish window after committed attacks, without changing damage or contact authority.

## Non-goals

- New VFX architecture, art/rigs, perfect guard/parry, posture, knockback, M10, closing/tagging M9, global damage/HP/guard/dodge rebalance.

## Steps

- [x] 0. Audit current telegraph + lock timing/presentation contract
  - depends: —
  - risk: LOW
  - isolation: sequential
  - owns/allows: PLAN locked timings; HANDOFF audit notes
  - verifier: PLAN records before/after step counts and presentation channels
- [x] 1. Tune authored attack timings + phase presentation
  - depends: 0
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `enemyRoles` attack steps, attack presentation projection, procedural pose/visual accents, focused tests
  - verifier: focused timing/presentation/hit-reaction/guard tests PASS
- [x] 2. Deterministic readability + startup-interrupt gate
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: one owned Playwright gate + package script; screenshots under ignored tmp/
  - verifier: `npm run gate:m9-telegraph-readability` PASS; cleanup/port reuse
- [x] 3. Verify and hand off
  - depends: 1, 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: PLAN/HANDOFF/current-state/REPOMAP; DEBT only if real deferred limitation
  - verifier: lint/typecheck/test/build/verify + lifecycle + doctor/sync/git guard

## Locked contract

- Simulation phases remain authoritative. Presentation derives from `action.phase` only.
- Skirmisher attack steps: startup **20**, active **10**, recovery **24**.
- Brute attack steps: startup **48**, active **12**, recovery **48**.
- Startup: stronger wind-up pose + telegraph ring + brief emissive accent.
- Active: committed swing pose; no interrupt (unchanged).
- Recovery: readable open/recover pose + distinct recovery cue; no reattack until recovery completes; interruptible by heavy per MB2.
- Punish window = recovery itself (not a new state). Light attack must be landable when in range.

## Escalation

- Stop if readability requires animation-driven contact or a new combat authority.
- Same failure 3× → stuck report.
