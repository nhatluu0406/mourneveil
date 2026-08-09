# Agent Routing

Route by task risk, contract clarity, and the capability of the available model—not by product name alone.

## Codex

Best used strategically for:

- High-risk gameplay authority and simulation architecture
- Combat, enemy, save, and migration architecture
- Difficult cross-module root-cause work
- High-risk integration where invariants are still being established

Codex quota is limited. Reserve it for work where stronger architecture reasoning materially reduces risk.

## Cursor

Cursor can use strong GPT, Claude, Grok, and other supported models. It may own:

- Medium-risk implementation and stable-contract implementation
- Large related macro-batches with internal gates
- Browser/runtime verification
- UI, presentation, and content
- Scoped refactors
- CI, documentation, and repository maintenance
- Selected high-risk tasks when the contract is already explicit

Choose the model and workflow that match the task rather than treating Cursor as a small-fix-only tool.

## Claude compatibility

Claude is deferred from the normal Mourneveil workflow. Keep compatibility files that LeanLoop or project tooling expects, but do not require Claude as an active reviewer. It may be reintroduced later by explicit policy.

## Escalation

Do not repeat the same failed path indefinitely. Refine the reproduction after the first failure; after three attempts on the same error, stop, persist the failure and hypotheses in active task state, and escalate.

Agents receive only the current task packet, canonical state, relevant contracts/skills, focused source, and verification evidence.
