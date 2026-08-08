# Current State

- Updated: 2026-08-09
- Milestone: **M1 implementation complete** — READY FOR PRODUCT OWNER ACCEPTANCE
- Active LeanLoop task: `m1-graybox-movement`
- Status: Graybox movement foundation (sim, keyboard+gamepad intent, motor, collision, follow camera) is in `main`. Physical gamepad manual verification and formal PO acceptance remain. M2 not started.

## What exists

- Fixed-step simulation + semantic movement intents (keyboard + left-stick gamepad)
- Composition: sum sources then clamp magnitude ≤ 1
- Kinematic graybox capsule with Rapier collision/grounding
- Presentation-only high-oblique follow camera
- Diagnostic panel: milestone M1.4, intent, active input source, pose, grounded, camera mode

## Where truth lives

- Law: `STACK.md`
- Execution: `PLAN.md` (M1 steps 1–4 ticked)
- Recovery: `state/tasks/m1-graybox-movement/HANDOFF.md`

## Known limitations / debt

- Physical controller play-pass not recorded this session (adapter + tests present)
- Sustained WASD feel weight deferred as non-blocking tuning debt
- No committed browser automation suite
- Bundle-size advisory deferred

## Next executable work

Product Owner M1 acceptance. After acceptance, plan M2 combat foundation separately — do not invent M2 here.
