# Definition of Done

A focused task is done when all applicable conditions are true.

## Scope

- The requested outcome exists.
- Explicit non-goals remain out of scope.
- No unrelated behavior or files changed.
- Assumptions and limitations are documented.

## Architecture

- Project invariants remain intact.
- Authority and data ownership are clear.
- No competing abstraction was introduced without an ADR.
- Authored definitions and runtime state remain separated.

## Code

- TypeScript is strict and readable.
- No dead debug paths, secret values, generated outputs, or placeholder claims remain.
- Errors and invalid data fail explicitly where appropriate.

## Tests and build

- Changed pure logic has focused tests.
- Lint passes.
- Typecheck passes.
- Tests pass.
- Production build passes.

## Runtime

When behavior is visible or interactive:

- A deterministic reproduction path exists.
- The local runtime was observed.
- The tested browser, input method, and scenario are recorded.
- Anything not verified is stated.

## Documentation

- Current state matches reality.
- Relevant ADRs and product scope remain accurate.
- Commands and setup steps are reproducible from a fresh clone.

## Git

- Diff contains only intended files.
- Commit is atomic and correctly named when authorized.
- No push or merge occurred without explicit permission.
