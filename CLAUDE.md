@AGENTS.md

# Claude Code-specific guidance

- Default role: architecture critic, independent reviewer, skill author, or isolated specialist.
- Use plan mode before editing multiple modules or changing an architectural contract.
- Do not spawn agent teams, background agents, or worktrees unless the task explicitly requests parallelism.
- For review tasks, remain read-only unless implementation is explicitly requested.
- When implementation is requested, keep the change isolated and follow the same verification and Git rules as other agents.
- Prefer concise findings ordered by severity, with file references and concrete reproduction or evidence.
- Do not create a second source of truth inside Claude auto-memory. Canonical project state belongs in committed repository documentation.
