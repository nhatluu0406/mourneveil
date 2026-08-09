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
- Production builds do not expose development mutation gates or development-only diagnostic UI.

## Tests and build

- Changed pure logic has focused tests.
- Lint passes.
- Typecheck passes.
- Tests pass.
- Production build passes.

When package metadata changes:

- npm `10.9.2` is used.
- `package-lock.json` is regenerated with npm `10.9.2`.
- A clean `npm ci` passes with the canonical Node/npm contract.
- `npm run verify` passes.

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

For milestone closure:

- Local verification and required runtime gates pass.
- Committed canonical documentation matches the accepted repository state.
- GitHub CI uses the same Node/npm/`npm ci` contract as local verification.
- After push, a failed CI run blocks further normal milestone work until repository integrity is restored.

## Git

- Diff contains only intended files.
- Commit is atomic and correctly named when authorized.
- No push or merge occurred without explicit permission.
