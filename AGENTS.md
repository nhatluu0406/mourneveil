# AGENTS.md

## Project identity

- Working title: Mourneveil
- Product: local-first browser-based 3D action RPG vertical slice
- Primary stack: TypeScript, React, Vite, Three.js, React Three Fiber, Rapier
- Package manager: npm
- Current priority: a reliable local vertical slice, not deployment
- Working language for code, identifiers, commits, and repository documentation: English

## Source-of-truth order

Before every task, resolve truth in this order:

1. Current Git HEAD, branch, status, and working tree
2. `docs/development/current-state.md`
3. Accepted ADRs under `docs/architecture/decisions/`
4. Product scope under `docs/product/`
5. The current task prompt and explicitly named skill
6. Other documentation
7. Old reports or conversation context

Do not rely on a branch name, commit hash, dependency version, or file layout copied from an old prompt without checking the repository.

## Operating model

- Use a LEAN single-writer workflow.
- Only one coding agent may modify the active working tree at a time.
- Do not spawn subagents, worktrees, or parallel implementation unless the task explicitly authorizes it.
- Prefer focused changes with clear acceptance criteria.
- Do not perform broad audits, screenshot matrices, speculative refactors, or unrelated cleanup unless requested.
- Product Owner runtime observations outrank an automated claim that a feature works.

## Before editing

Always:

1. Run `git status --short --branch`.
2. Inspect the current branch and recent relevant commits.
3. Read this file.
4. Read `docs/development/current-state.md`.
5. Read the relevant product, architecture, and task documents.
6. Read the explicitly named skill under `.agents/skills/`.
7. Identify unrelated user changes and preserve them.
8. State assumptions in the final report rather than silently inventing requirements.

If the working tree contains unrelated changes, do not overwrite, discard, stage, or reformat them.

## Architecture invariants

- React is the application shell and UI projection layer; it is not the authority for combat or simulation outcomes.
- Authoritative game state belongs in the game/simulation layer.
- Input produces intents; the simulation resolves outcomes; render, UI, VFX, and audio consume typed state or events.
- Physics supplies collision queries and contacts. A physics contact alone must not decide damage, loot, death, cooldown, or progression.
- Authored definitions are immutable data. Runtime entities hold mutable instance state.
- Timing, damage, stamina/resolve costs, cooldowns, and action cancellation rules must have a single authoritative definition.
- Save data is versioned from its first implementation.
- Debug fixtures must be deterministic and must not become a second production implementation.
- Prefer explicit module contracts over a global event bus, global mutable store, or cross-module imports.
- Do not introduce an ECS, custom engine, backend, multiplayer layer, procedural world system, or deployment platform during the initial vertical slice unless an accepted ADR authorizes it.

## Initial module boundaries

The intended direction is:

- `src/app/`: bootstrap and application lifecycle
- `src/game/core/`: simulation clock, runtime contracts, game events
- `src/game/character/`: player runtime and actions
- `src/game/combat/`: action timing, hits, guard, damage, posture
- `src/game/enemies/`: enemy definitions and runtime
- `src/game/encounters/`: encounter orchestration
- `src/game/world/`: zones, checkpoints, shortcuts
- `src/game/items/`: item and equipment definitions
- `src/game/save/`: versioned persistence
- `src/render/`: Three.js / React Three Fiber projection
- `src/physics/`: Rapier adapter and collision queries
- `src/input/`: keyboard, mouse, and controller intents
- `src/ui/`: HUD and menus
- `src/content/`: authored data
- `src/audio/`: audio projection
- `src/debug/`: deterministic fixtures and diagnostics

Do not create empty abstraction layers merely to match this list. Add a module when the milestone needs it.

## Scope discipline

For every implementation task:

- Implement only the requested outcome.
- Keep non-goals explicit.
- Do not add a second system before the current system has runtime proof.
- Do not download or generate production assets unless the task explicitly requests it.
- Use simple procedural or primitive placeholders for graybox work.
- Prefer one complete happy path over several incomplete variants.

## Quality and verification

The minimum verification for a code change is:

- Focused tests for changed pure logic
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Run only commands that exist in the current repository. If a command does not exist yet, report that fact instead of pretending it passed.

Gameplay or visual changes also require a local runtime check with a deterministic reproduction path. Record what was observed and what was not verified.

## Git safety

- Never read, print, modify, stage, or commit secrets.
- Keep `.env` files untracked except `.env.example`.
- Never use `git reset --hard`, `git clean -fd`, force push, or history rewriting without explicit permission.
- Never delete branches or tags without explicit permission.
- Never merge into `main` without explicit permission.
- Never push unless the current task explicitly grants push permission.
- A task may create one atomic local commit when all requested verification passes.
- Do not amend or squash an existing commit unless explicitly requested.
- Do not stage unrelated changes.
- Commit messages use Conventional Commits, for example:
  - `chore(repo): bootstrap project foundation`
  - `feat(combat): add light attack state machine`
  - `fix(input): preserve movement after focus regain`

## Assets and licensing

- Every non-trivial external asset must have known provenance and redistribution status.
- Do not commit assets with unclear licenses.
- Keep editable source assets separate from optimized runtime assets.
- Do not add Git LFS patterns speculatively. Add them when the first qualifying source asset is introduced and document the decision.
- A declared path is not proof that an asset is present or used at runtime.

## Canonical documentation

Update `docs/development/current-state.md` when a task changes:

- Repository structure
- Build or test commands
- Runtime behavior
- Accepted architecture
- Current milestone status
- Known limitations
- The next recommended task

Do not rewrite product scope or an accepted ADR merely to make an implementation look compliant. Escalate the mismatch.

## Skills

Canonical shared skills live under `.agents/skills/`.

Current skills:

- `implement-focused-change`
- `verify-game-change`
- `review-milestone`

Use a skill when the task names it or clearly matches its description. Do not load every skill into every task.

## Required final report

Every implementation task must report:

1. Repository state
2. Objective completed
3. Files changed
4. Runtime behavior
5. Verification performed, with exact commands and results
6. Manual observations
7. Known gaps or unverified areas
8. Commit hash and message, if committed
9. Recommended next task

Be precise. “Implemented” means the behavior exists in the current working tree and has evidence.
