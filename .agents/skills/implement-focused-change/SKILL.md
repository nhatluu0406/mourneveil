---
name: implement-focused-change
description: Use when implementing a scoped feature, bug fix, refactor, or repository task with explicit acceptance criteria.
---

# Objective

Complete one focused task without architectural drift, unrelated cleanup, or unsupported claims.

# Required workflow

1. Inspect Git branch, HEAD, status, and relevant recent commits.
2. Read `AGENTS.md`, `docs/development/current-state.md`, the task prompt, and relevant canonical documents.
3. Identify the requested outcome, non-goals, allowed files, and acceptance criteria.
4. Inspect the existing implementation before proposing a change.
5. Choose the smallest coherent implementation that satisfies the task.
6. Preserve unrelated changes.
7. Add or update focused tests for changed pure behavior.
8. Run the verification required by the task and `AGENTS.md`.
9. Update canonical documentation only when repository truth changed.
10. Create one atomic local commit only when authorized and verification passes.
11. Return the required report.

# Defaults

- Prefer explicit types and small module contracts.
- Prefer extending an accepted pattern over adding a competing abstraction.
- Prefer deterministic fixtures for runtime states that are hard to reproduce.
- Prefer a complete happy path over multiple partial variants.
- Keep generated files and build outputs untracked.

# Forbidden shortcuts

- Do not replace a failing test with a weaker assertion merely to make it pass.
- Do not mock the behavior whose integration is the purpose of the task.
- Do not silently change product scope or an accepted ADR.
- Do not report a visual or gameplay behavior as verified without running it.
- Do not stage unrelated files.

# Completion evidence

The final report must include exact changed files, commands run, results, runtime observations, limitations, and commit information.
