# Development Workflow

## Primary loop

1. Director prepares a focused task packet.
2. One implementation agent modifies the active working tree.
3. The agent runs focused tests and the local build.
4. Product Owner checks the happy path when runtime behavior changed.
5. Director reviews the report and evidence.
6. The task is fixed, accepted, or reverted deliberately.
7. Only accepted work proceeds toward merge.

## Agent roles

### Codex

Core architecture, simulation, combat contracts, cross-module integration, difficult root-cause debugging, and milestone integration.

### Cursor

Focused implementation under stable contracts, local runtime debugging, HUD, camera tuning, asset wiring, visual integration, and small fixes.

### Claude Code

Architecture review, independent code review, edge-case analysis, skill authoring, documentation review, and isolated specialist tasks.

## Single-writer rule

Only one coding agent modifies the active working tree at a time.

Parallel work requires:

- Explicit authorization
- Separate worktrees
- Locked interfaces
- Non-overlapping files
- Independent acceptance checks

## Task packet structure

- Role
- Current repository state
- Objective
- Why this task now
- Read first
- Allowed scope
- Non-goals
- Requirements
- Acceptance criteria
- Verification
- Git permissions
- Report format

## Commit policy

- Work on short-lived `feat/*`, `fix/*`, `chore/*`, or `docs/*` branches.
- Local atomic commits are allowed only when the task grants permission and checks pass.
- Push, pull request, merge, branch deletion, tag creation, and history rewriting require explicit permission.
- `main` represents an accepted local state.

## Milestone acceptance

A milestone is accepted only when:

- Automated checks pass
- The local production build runs
- Required deterministic fixtures work
- Product Owner observations are addressed
- Canonical docs match the repository
- Known debt is explicit
