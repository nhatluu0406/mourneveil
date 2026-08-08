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
2. `STACK.md` — operational project law
3. `PLAN.md` — current execution graph
4. Active LeanLoop task state (`python3 scripts/leanloop/task.py path`) — HANDOFF / CHECKPOINT
5. Accepted ADRs under `docs/architecture/decisions/`
6. Product scope under `docs/product/`
7. `docs/development/current-state.md` — concise milestone summary only
8. Old reports or conversational context

Do not duplicate detailed operational or plan state across these files. Do not rely on a branch name, commit hash, dependency version, or file layout copied from an old prompt without checking the repository.

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
3. Read this file, then `STACK.md`, `PLAN.md`, and the active task HANDOFF/CHECKPOINT.
4. Read `docs/development/current-state.md` for milestone status only.
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

- Put stable operational law in `STACK.md`.
- Put the active execution graph and step evidence in `PLAN.md` and the active task HANDOFF.
- Keep `docs/development/current-state.md` as a short milestone summary: status, known limitations, and the next PLAN step pointer — not a second STACK/PLAN.

Update that summary when milestone status, limitations, or the next recommended task change. Do not rewrite product scope or an accepted ADR merely to make an implementation look compliant. Escalate the mismatch.

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

<!-- LEANLOOP:ADAPTER:START -->
# LeanLoop — Codex adapter

**Spend tokens on decisions, not repetition.** Treat chat context as disposable; crystallize decisions and task state to disk.

## Start every task
1. Read `STACK.md` / `PLAN.md` when present, plus active task state (`python3 scripts/leanloop/task.py path`). Create missing planning files from templates before non-trivial work.
2. Use `state/REPOMAP.md` before exploratory reads; grep first, then ranged reads.
3. Run `python3 scripts/leanloop/git_guard.py` before editing. If the main tree is dirty, isolate the task in a Git worktree rather than touching existing changes.

## Hard rules
- Non-trivial code requires PLAN.md with per-step machine verifiers and explicit non-goals.
- STACK.md is project law; contracts are the source of truth for boundaries; DB changes use migrations.
- Parallel implementation is allowed only across isolated Git worktrees/branches. Never let workers share a working tree or Git index.
- Use risk-adaptive model routing: cheap execution for deterministic low-risk work; strongest available reasoning for security, concurrency, data loss, migrations, architecture-sensitive refactors, or ambiguous failures.
- Same error 3 times → stop, persist a stuck report under active task state, escalate.
- Gate every step: formatter/lint → typecheck → step verifier → impacted tests → domain gates → `git diff --check` → diff review.
- Commit only explicit paths (`python3 scripts/leanloop/safe_commit.py ...`); `git add .`, wildcard staging, and mixed-scope commits are forbidden.
- After a green step: commit → tick PLAN.md → refresh task checkpoint/handoff. Session end: write HANDOFF.
- Replies and delegated reports stay compressed; details belong in files, not repeated chat.

## Skills
Codex discovers canonical skills from `.agents/skills/`. Do not duplicate their descriptions here. Tier membership is defined once in `.leanloop/kit/skills.json`; use only skills relevant to the project/task.

Full workflow: `.leanloop/kit/PLAYBOOK.md`.
<!-- LEANLOOP:ADAPTER:END -->
