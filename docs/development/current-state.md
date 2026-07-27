# Current State

- Updated: 2026-07-28
- Milestone: M0 — Project Foundation
- Status: governance pack prepared; runtime scaffold not implemented

## Repository state expected before Prompt 000

The repository should contain:

- `AGENTS.md`
- `CLAUDE.md`
- `.agents/skills/`
- `.claude/skills/`
- `.cursor/rules/`
- `docs/`
- `prompts/`
- `.gitignore`
- `.gitattributes`
- `README.md`

No application code or package configuration is required before Prompt 000.

## Accepted architecture

ADR-0001 selects TypeScript, React, Vite, Three.js, React Three Fiber, Rapier, npm, and Vitest for a local browser runtime.

## Current commands

No npm commands exist yet.

Prompt 000 must create and verify the initial commands.

## Known limitations

- No application scaffold
- No automated tests
- No CI
- No runtime
- No gameplay
- No assets
- No deployment configuration

## Next task

Execute `prompts/000-bootstrap-foundation.md` with Codex on a short-lived feature branch.
