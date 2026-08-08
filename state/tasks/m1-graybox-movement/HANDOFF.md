# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-08 by Codex
Task: m1-graybox-movement

## Status
M1.1 is implemented: a bounded 60 Hz fixed-step clock, normalized semantic movement intent, WASD/arrow browser input with reset/focus safety, and a development diagnostic. Focused tests and `npm run verify` pass. The dev endpoint returned HTTP 200; live browser interaction remains unverified because the browser controller reported no available instance. M1.2 has not started.

## Locked decisions
- Source-of-truth: Git HEAD → STACK.md → PLAN.md → active task HANDOFF/CHECKPOINT → ADRs → product docs → current-state.md → chat/old reports
- M1 scope is graybox movement only; combat is M2+
- M1.1/M1.2 prefer Codex; M1.3/M1.4 prefer Cursor
- `install.json` digests match LF-normalized managed files (not Windows CRLF install-time bytes)
- Simulation time is fixed at 60 Hz; frame deltas clamp to 250 ms; catch-up is capped at 8 steps; excess whole-step backlog is discarded while fractional remainder is retained
- Movement intent exposes normalized `horizontal`/`forward` axes; raw WASD/arrow codes remain in the browser adapter; blur, hidden-tab, explicit reset, and disconnect clear held state

## In flight
- PLAN step 1 (M1.1 Simulation and input authority) — complete
- PLAN step 2 (M1.2 Graybox character controller) — next; not started
- Worktree: main; no feature branch; no push

## Known traps
- On Windows, LeanLoop doctor digests must track `eol=lf` working-tree bytes; reinstalling on Windows without refreshing digests can revive CRLF hash drift
- `state/CURRENT_TASK` and `state/tasks/*/CHECKPOINT.md` are local-only (gitignored)
- Do not treat Product Owner M0 acceptance as done without an explicit PO note
- git_guard will refuse a dirty main tree — use a worktree for M1 implementation if other changes appear
- M1.1 manual browser checks still needed: counter/time advances, WASD/arrows update and release to neutral, focus loss resets input, primitive stays fixed, no console errors

## Next session starts with
1. Read STACK.md, PLAN.md, and this HANDOFF; inspect current Git state
2. Execute PLAN step 2 (M1.2) with Codex, consuming the M1.1 contracts; do not start M1.3 or combat
