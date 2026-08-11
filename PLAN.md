# PLAN: M9 Combat Depth — Player Attack Commitment + Hit Feedback
<!-- Live M9 graph only. -->

Input: Product Owner M9 macro-batch 4 | Stack: `STACK.md` | Task: `m9-combat-depth`

## Goal

Make player light/heavy attacks read as committed actions and make hit outcomes visually distinguishable, without new combat authority.

## Non-goals

- Combos, charge attacks, stamina, parry, posture, knockback, animation-driven contact, VFX framework, M10, closing/tagging M9, global damage/HP/enemy timing rebalance.

## Steps

- [x] 0. Audit player attack feel + lock timing/feedback contract
  - depends: —
  - risk: LOW
  - isolation: sequential
  - owns/allows: PLAN locked values
  - verifier: PLAN records before/after light/heavy steps and feedback hierarchy
- [x] 1. Tune commitment presentation (+ optional fixed-step timing) and recovery movement scale
  - depends: 0
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `playerAttackActions`, procedural pose, attack presentation, movement constraint
  - verifier: focused attack/pose/movement tests PASS
- [x] 2. Hit-confirmation hierarchy (camera + material cues from authoritative contact)
  - depends: 0
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: pure feedback projection, FollowCameraRig, PlayerVisual; focused tests
  - verifier: miss/hit/interrupt/defeat/dedup tests PASS
- [x] 3. Player-combat Playwright gate + verify/hand off
  - depends: 1, 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: one owned gate + package script; PLAN/HANDOFF/current-state/REPOMAP; M9 readiness report
  - verifier: `gate:m9-player-combat` PASS; lint/typecheck/test/build/verify; doctor/sync/git guard

## Locked contract

- Simulation phases remain authoritative. Presentation derives from combat phase + contact events only.
- Light steps: startup **10**, active **5**, recovery **16** (was 8/4/14).
- Heavy steps: startup **18**, active **8**, recovery **38** (was 18/6/30). Startup stays ≤ skirmisher startup (20) so simultaneous wind-ups remain interruptible; commitment weight moves into recovery.
- Movement: startup/active fully constrained; recovery allows **0.35** intent scale; facing freeze unchanged.
- Hit confirm hierarchy (outgoing): miss none < light damaged < heavy damaged < interrupt (enemy hitReaction) < defeat.
- Camera impulse magnitudes follow that hierarchy; same execution cannot duplicate; miss produces no impulse.
- No animation-driven contact; no new VFX system.

## Escalation

- Stop if readability requires animation-owned timing or a new combat authority.
- Same failure 3× → stuck report.
