# Prompt 000 — Bootstrap Mourneveil Foundation

You are the primary implementation agent for Mourneveil.

## Objective

Bootstrap Milestone M0 as a reliable local web-game foundation. This task creates the application scaffold, dependency baseline, minimal runtime proof, test harness, and CI. It must not implement gameplay.

## Start by inspecting reality

Before editing:

1. Run `git status --short --branch`.
2. Record the current branch, HEAD, working tree, and recent commits.
3. Read:
   - `AGENTS.md`
   - `docs/development/current-state.md`
   - `docs/product/vision.md`
   - `docs/product/vertical-slice.md`
   - `docs/architecture/overview.md`
   - `docs/architecture/decisions/0001-web-stack.md`
   - `.agents/skills/implement-focused-change/SKILL.md`
4. Preserve all unrelated user changes.
5. Do not assume the repository is empty merely because this prompt says it should be.

## Branch

If currently on `main` and the working tree is clean, create:

`feat/m0-project-foundation`

If the branch or working tree differs, do not destructively normalize it. Report the state and proceed only when safe.

## Required implementation

### 1. Scaffold

Create a Vite React TypeScript application in the repository root using npm.

Use the current compatible package versions resolved by npm. Do not pin guessed historical versions.

Install the minimal runtime dependencies required for M0:

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/rapier`

Add Vitest and only the minimal test support needed for a pure TypeScript unit test.

Do not add:

- React Router
- Zustand or another global store
- Playwright
- An ECS
- A backend
- Deployment packages
- Analytics
- Production art or audio
- A character controller
- Combat, enemy, item, save, or progression systems

### 2. Package scripts

Provide working scripts:

- `dev`
- `lint`
- `typecheck`
- `test`
- `test:watch`
- `build`
- `verify`

`verify` must run lint, typecheck, tests, and build in a deterministic order.

### 3. TypeScript and formatting

- Enable strict TypeScript.
- Preserve useful Vite defaults.
- Configure ESLint so the scaffold has no lint errors.
- Add a minimal formatting policy only if necessary; do not spend the task introducing a large style toolchain.
- Commit the npm lockfile.

### 4. Initial source structure

Create only the directories needed to demonstrate the accepted boundaries, without filling the repository with empty abstractions.

At minimum, establish:

- `src/app/`
- `src/render/`
- `src/game/core/`
- `src/debug/`

The application should have a clear bootstrap component, a render scene component, a tiny pure game-core utility, and one deterministic foundation diagnostic.

### 5. Minimal runtime proof

The local app must render:

- A full-window React Three Fiber canvas
- A simple procedural ground or platform
- One primitive scene object
- Basic lighting
- A stable high-oblique camera
- A small HTML diagnostic panel that clearly states:
  - Working title
  - Milestone M0
  - Renderer ready
  - Physics ready

Rapier must be genuinely initialized in the scene. Do not display “Physics ready” from a hard-coded decorative string that is unrelated to the mounted physics world.

Do not implement player movement or gameplay.

The page must remain usable if WebGL initialization fails: show a readable error boundary or fallback message.

### 6. Deterministic foundation diagnostic

Provide a small deterministic diagnostic function or state that can be tested without WebGL or the DOM.

Add at least one focused Vitest test that proves the diagnostic or game-core utility.

Do not use snapshot tests as the only proof.

### 7. Repository hygiene

Update or create:

- `.gitignore`
- `.gitattributes`
- `.env.example` only if an environment variable is actually required; otherwise do not create it
- `README.md` with exact local setup and commands
- `docs/development/current-state.md`

Keep:

- `.env*` ignored except `.env.example`
- `CLAUDE.local.md` ignored
- build, coverage, test-report, editor, log, and local runtime artifacts ignored

Do not configure Git LFS during this task because no qualifying source asset is being introduced.

### 8. CI

Create a minimal GitHub Actions workflow for pushes and pull requests that:

1. Checks out the repository
2. Uses a supported Node 22 runtime
3. Runs `npm ci`
4. Runs `npm run verify`

Do not add deployment, caching complexity, artifact uploads, matrix builds, or browser automation.

### 9. Documentation truth

Update `docs/development/current-state.md` with:

- Actual repository structure
- Actual Node/npm requirements
- Actual commands
- Runtime behavior
- Verification results
- Current limitations
- The recommended M1 planning task

Do not mark M0 accepted merely because implementation finished. State that Product Owner local verification is still required.

## Acceptance criteria

- Fresh `npm install` succeeds.
- `npm run dev` launches the local runtime.
- The R3F scene and Rapier physics world mount successfully.
- The fallback path is readable when rendering initialization fails.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run test` passes.
- `npm run build` passes.
- `npm run verify` passes.
- CI configuration calls the same verified commands.
- No gameplay, backend, deployment, external assets, or speculative framework is introduced.
- The working tree contains no generated build output.
- Canonical documentation matches the actual repository.

## Manual verification

Run the local application and record:

- Local URL
- Browser used
- Whether the canvas rendered
- Whether the diagnostic panel rendered
- Whether the scene remained stable after resize
- Any console errors or warnings
- What was not manually tested

Do not create a screenshot matrix.

## Git permissions

- You may create the feature branch.
- You may create one atomic local commit after all verification passes.
- Commit message: `chore(repo): bootstrap Mourneveil foundation`
- Do not push.
- Do not merge.
- Do not create or delete tags.
- Do not rewrite history.

## Required report

Return:

1. Repository state
2. Objective completed
3. Files changed
4. Dependency and script summary
5. Runtime behavior
6. Exact verification commands and results
7. Manual observations
8. Known gaps or unverified areas
9. Commit hash and message
10. Recommended next task
