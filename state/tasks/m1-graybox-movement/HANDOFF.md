# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-08 by Cursor/Composer
Task: m1-graybox-movement

## Status
M0 foundation remains in the repo (React/R3F/Rapier shell, foundation diagnostic, `npm run verify`). LeanLoop Tier 0+1 is installed and aligned: `STACK.md` + M1 `PLAN.md` exist; source-of-truth order updated in `AGENTS.md`; `docs/development/current-state.md` is a milestone summary. No M1 gameplay implementation has started. Product Owner local browser acceptance for M0 is still open and does not block planning M1.

## Locked decisions
- Source-of-truth: Git HEAD → STACK.md → PLAN.md → active task HANDOFF/CHECKPOINT → ADRs → product docs → current-state.md → chat/old reports
- M1 scope is graybox movement only; combat is M2+
- M1.1/M1.2 prefer Codex; M1.3/M1.4 prefer Cursor
- `install.json` digests match LF-normalized managed files (not Windows CRLF install-time bytes)

## In flight
- PLAN step 1 (M1.1 Simulation and input authority) — not started
- Worktree: main @ workflow-alignment commit (this session); no feature branch

## Known traps
- On Windows, LeanLoop doctor digests must track `eol=lf` working-tree bytes; reinstalling on Windows without refreshing digests can revive CRLF hash drift
- `state/CURRENT_TASK` and `state/tasks/*/CHECKPOINT.md` are local-only (gitignored)
- Do not treat Product Owner M0 acceptance as done without an explicit PO note
- git_guard will refuse a dirty main tree — use a worktree for M1 implementation if other changes appear

## Next session starts with
1. Read STACK.md, PLAN.md, and this HANDOFF; run `python3 scripts/leanloop/doctor.py --strict`
2. Execute PLAN step 1 (M1.1) with Codex on a clean tree or isolated worktree — do not start M1.2+ first
