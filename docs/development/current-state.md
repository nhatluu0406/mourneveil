# Current State

- Updated: 2026-08-09
- Milestone: M1 in progress; M1.3 complete in repo
- Active LeanLoop task: `m1-graybox-movement`
- Status: High-oblique follow camera and graybox readability are in. M1.2.1 fixed the center-blocker visual clipping and added real-Rapier collision regression coverage. Deferred: sustained-WASD feel lag. Next PLAN step is M1.4.

## What exists

- Local web-game foundation plus fixed-step locomotion and a presentation-only high-oblique follow camera
- Paths: `src/app/`, `src/render/` (incl. `followCamera.ts`, `FollowCameraRig.tsx`), `src/physics/`, `src/game/core/`, `src/game/character/`, `src/input/`, `src/debug/`
- No combat, controller mapping (M1.4), audio, save, or production art

## Where truth lives

- Law: `STACK.md`
- Execution: `PLAN.md`
- Recovery: `state/tasks/m1-graybox-movement/HANDOFF.md`

## Known limitations

- M1.2.1 browser replay remains pending because no controllable browser was available; automated Rapier and visual-geometry regressions are green
- Sustained WASD movement feel still laggy; deferred by PO
- PO M0 formal acceptance still open
- No committed automated browser suite (ad-hoc Playwright used for M1.3 smoke only)
- Three/Rapier bundle size advisory deferred

## Next executable PLAN step

M1.4 — Controller input foundation and M1 verification (Cursor). Include the pending center-blocker browser replay in the M1 runtime check; do not start combat.
