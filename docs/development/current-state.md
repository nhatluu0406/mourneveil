# Current State

- Updated: 2026-08-08
- Milestone: M1 in progress; M1.2 complete in repo
- Active LeanLoop task: `m1-graybox-movement`
- Status: M1.2 fixed-step graybox locomotion, Rapier collision/grounding, render projection, and diagnostics are implemented and mechanically verified. Product Owner local M0 browser verification remains open.

## What exists

- Local web-game foundation: React shell, R3F scene, Rapier world, development diagnostic, CI via `.github/workflows/ci.yml`
- Implemented paths today: `src/app/`, `src/render/`, `src/physics/`, `src/game/core/`, `src/game/character/`, `src/input/`, `src/debug/`
- Fixed-step movement drives one kinematic graybox capsule through Rapier collision/grounding; no combat, animation, camera follow, audio, save, or production art

## Where truth lives

- Law: `STACK.md`
- Execution: `PLAN.md` (M1 steps)
- Recovery: `state/tasks/m1-graybox-movement/HANDOFF.md`
- Product/ADR: `docs/product/`, `docs/architecture/`

## Known limitations

- PO M0 browser acceptance not recorded as done
- No automated browser tests
- M1.1 live key/focus-loss checks and M1.2 live movement/collision/grounding/resize/console checks remain unverified because no controllable browser was available
- Three/Rapier bundle size advisory deferred
- Doctor digests must stay aligned with LF-normalized managed files on Windows

## Next executable PLAN step

M1.3 — Camera and runtime tuning (Cursor, MEDIUM). Consume the authoritative player transform; do not add combat.
