# Current State

- Updated: 2026-08-08
- Milestone: M1 in progress; M1.1 complete in repo
- Active LeanLoop task: `m1-graybox-movement`
- Status: M1.1 fixed-step simulation and semantic movement-input contracts are implemented and mechanically verified. Product Owner local M0 browser verification remains open.

## What exists

- Local web-game foundation: React shell, R3F scene, Rapier world, M0 foundation diagnostic, CI via `.github/workflows/ci.yml`
- Implemented paths today: `src/app/`, `src/render/`, `src/game/core/`, `src/input/`, `src/debug/`
- Fixed-step simulation timing and keyboard-to-semantic movement intent exist; no character locomotion, combat, audio, save, or production art

## Where truth lives

- Law: `STACK.md`
- Execution: `PLAN.md` (M1 steps)
- Recovery: `state/tasks/m1-graybox-movement/HANDOFF.md`
- Product/ADR: `docs/product/`, `docs/architecture/`

## Known limitations

- PO M0 browser acceptance not recorded as done
- No automated browser tests
- M1.1 live key, focus-loss, diagnostic, and console checks remain unverified because no controllable browser was available
- Three/Rapier bundle size advisory deferred
- Doctor digests must stay aligned with LF-normalized managed files on Windows

## Next executable PLAN step

M1.2 — Graybox character controller (Codex, HIGH). Consume the M1.1 contracts; do not start camera tuning or combat.
