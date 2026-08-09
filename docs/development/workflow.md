# Development Workflow

## Default solo loop

```text
clean main
↓
macro-task covering 2–4 tightly related PLAN steps
↓
internal verification gate after each step
↓
reversible explicit-path commits
↓
one final report
↓
Product Owner review and push
```

Direct work on clean `main` is normal for the current solo project when the task authorizes it. Only one coding agent may modify the active working tree.

## Macro-batches

Related PLAN steps may run in one session when:

- A later step consumes the contract produced by an earlier step.
- One agent can own the sequence safely.
- No Product Owner design decision is needed between steps.
- Every step has an explicit internal verification gate.

A failed internal gate stops later steps. Do not continue a batch around a broken dependency, runtime, save, browser, or repository-integrity contract.

## When to isolate work

Use a branch or worktree when:

- Work is risky or experimental.
- Parallel writers are explicitly required.
- Unrelated dirty work must be preserved and isolated.
- Independent rollback or review materially reduces risk.

Parallel writers require separate worktrees, locked contracts, non-overlapping ownership, and independent acceptance checks.

## Commits and Git authority

- Commit only when the task grants permission and the relevant gate passes.
- Use `scripts/leanloop/safe_commit.py` with an explicit path allowlist.
- Keep commits reversible and aligned with internal gates.
- Push, pull request, merge, tag, branch deletion, and history rewrite require explicit permission.
- The Product Owner reviews and pushes accepted local work.

## Milestone acceptance

A milestone is accepted only when automated checks, production build, deterministic browser/runtime evidence, canonical documentation, and Product Owner observations agree. Known debt must be explicit.
