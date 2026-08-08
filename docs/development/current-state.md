# Current State

- Updated: 2026-08-08
- Milestone: M0 complete in repo; M1 planned, not started
- Active LeanLoop task: `m1-graybox-movement`
- Status: workflow aligned to LeanLoop (`STACK.md`, `PLAN.md`, task HANDOFF). Product Owner local M0 browser verification still required before formal M0 acceptance.

## What exists

- Local web-game foundation: React shell, R3F scene, Rapier world, M0 foundation diagnostic, CI via `.github/workflows/ci.yml`
- Implemented paths today: `src/app/`, `src/render/`, `src/game/core/`, `src/debug/`
- No movement, combat, audio, save, or production art

## Where truth lives

- Law: `STACK.md`
- Execution: `PLAN.md` (M1 steps)
- Recovery: `state/tasks/m1-graybox-movement/HANDOFF.md`
- Product/ADR: `docs/product/`, `docs/architecture/`

## Known limitations

- PO M0 browser acceptance not recorded as done
- No automated browser tests
- Three/Rapier bundle size advisory deferred
- Doctor digests must stay aligned with LF-normalized managed files on Windows

## Next executable PLAN step

M1.1 — Simulation and input authority (Codex, HIGH). Do not start character movement until that contract is green.
