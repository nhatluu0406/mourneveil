---
name: verify-game-change
description: Use when validating a completed Mourneveil code, gameplay, UI, asset, build, or configuration change before commit or merge.
---

# Objective

Determine whether the current working tree satisfies the requested acceptance criteria and remains safe to integrate.

# Verification order

1. Inspect the task acceptance criteria.
2. Inspect `git diff --stat` and the relevant diff.
3. Check for unrelated edits, debug leftovers, generated artifacts, and secrets.
4. Run focused tests for changed logic.
5. Run repository checks that exist:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run build`
6. For gameplay or visual changes, start the local runtime and use a deterministic reproduction path.
7. Record observed behavior, browser/device/input used, and anything not tested.
8. Confirm canonical documentation remains accurate.
9. Recommend PASS, PASS WITH KNOWN LIMITATIONS, or FAIL.

# Review priorities

1. Correctness and regressions
2. Architecture invariant violations
3. Nondeterministic or frame-rate-dependent behavior
4. Save/data compatibility
5. Input and focus edge cases
6. Runtime asset failures
7. Performance regressions
8. Maintainability and test quality
9. Cosmetic issues

# Output

Return:

- Verdict
- Acceptance matrix
- Findings ordered by severity
- Commands and results
- Runtime observations
- Unverified areas
- Recommended next action

Do not modify code during a verification-only task unless explicitly authorized.
