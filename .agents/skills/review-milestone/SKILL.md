---
name: review-milestone
description: Use for a read-only milestone audit before merge, tagging, broadening scope, or starting the next major development phase.
---

# Objective

Audit the milestone against product scope, architecture, runtime proof, tests, and repository hygiene.

# Required inputs

- Milestone definition
- Current Git state
- `docs/development/current-state.md`
- Relevant product documents
- Relevant ADRs
- Implementation diff or commit range
- Verification evidence
- Product Owner observations

# Workflow

1. Confirm the reviewed commit range and working-tree state.
2. Build an acceptance matrix from the milestone definition.
3. Inspect architecture boundaries and data ownership.
4. Inspect test coverage for core state transitions and failure modes.
5. Inspect deterministic runtime fixtures and manual evidence.
6. Check docs, scripts, assets, licensing, and repository hygiene.
7. Identify deferred work that would make the next milestone unsafe.
8. Recommend:
   - ACCEPT
   - ACCEPT WITH EXPLICIT DEBT
   - REJECT

# Constraints

- Remain read-only unless the task explicitly requests fixes.
- Do not expand the milestone requirements during review.
- Separate blocking defects from polish and future enhancements.
- Treat Product Owner observations as evidence, even when automated checks pass.

# Output

- Decision
- Acceptance matrix
- Blocking findings
- Non-blocking debt
- Architecture assessment
- Runtime and test evidence assessment
- Safe next milestone
