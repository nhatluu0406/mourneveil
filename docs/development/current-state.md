# Current State

- Updated: 2026-08-09
- Milestone: M1 in progress; M1.3 complete in repo
- Active LeanLoop task: `m1-graybox-movement`
- Status: High-oblique follow camera and graybox readability are in. Open: center-blocker capsule clipping (M1.2 collision defect) and deferred sustained-WASD feel lag. Next PLAN step is M1.4.

## What exists

- Local web-game foundation plus fixed-step locomotion and a presentation-only high-oblique follow camera
- Paths: `src/app/`, `src/render/` (incl. `followCamera.ts`, `FollowCameraRig.tsx`), `src/physics/`, `src/game/core/`, `src/game/character/`, `src/input/`, `src/debug/`
- No combat, controller mapping (M1.4), audio, save, or production art

## Where truth lives

- Law: `STACK.md`
- Execution: `PLAN.md`
- Recovery: `state/tasks/m1-graybox-movement/HANDOFF.md`

## Known limitations

- **Capsule clips into center graybox cube** (PO screenshot) — treat as open collision defect before claiming collision-safe movement
- Sustained WASD movement feel still laggy; deferred by PO
- PO M0 formal acceptance still open
- No committed automated browser suite (ad-hoc Playwright used for M1.3 smoke only)
- Three/Rapier bundle size advisory deferred

## Next executable PLAN step

M1.4 — Controller input foundation and M1 verification (Cursor). Keep the center-blocker clipping defect visible; do not start combat.
