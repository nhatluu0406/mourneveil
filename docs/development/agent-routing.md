# Agent Routing

## Send to Codex when

- A core invariant changes
- Several modules must be integrated
- The simulation loop or action authority changes
- Combat, save migration, or enemy framework is involved
- A bug survived two focused Cursor attempts
- A milestone needs final integration

## Send to Cursor when

- The contract already exists
- Runtime visual iteration is the main work
- The task is localized to a small module or UI surface
- The change is a fixture, asset hookup, camera adjustment, CSS change, or focused bug
- Fast local edit-run-observe cycles are valuable

## Send to Claude Code when

- The task is primarily analysis or review
- Architecture or state-machine edge cases need independent scrutiny
- A skill or canonical document needs improvement
- A milestone needs a read-only audit
- A small isolated specialist implementation has a locked interface

## Escalation rule

Do not repeat the same failed prompt indefinitely.

- First failure: refine reproduction and scope.
- Second failure by the same implementation path: stop.
- Escalate with Git state, diff, logs, reproduction, and failed hypotheses to the core agent or reviewer.

## Context budget

Agents receive only:

- Current task packet
- `AGENTS.md`
- Current-state document
- Relevant ADR/product document
- Relevant skill
- Relevant source files and test output

Do not paste the entire project history into every prompt.
