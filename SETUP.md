# Local and GitHub Setup

## Prerequisites

Install and verify:

```powershell
git --version
node --version
npm --version
```

Use a current Node.js release that satisfies the current Vite requirement. The project CI will use Node 22.

Optional tools:

```powershell
gh --version
codex --version
claude --version
```

Cursor can open the repository without a separate CLI.

## Create the GitHub repository

Create a new repository on GitHub:

- Repository name: `mourneveil`
- Visibility: Private
- Do not initialize with a README
- Do not add `.gitignore`
- Do not add a license yet

The working title can be changed later.

## Clone and add the foundation pack

Example:

```powershell
cd C:\Workspace
git clone https://github.com/<YOUR_GITHUB_USERNAME>/mourneveil.git
cd mourneveil
```

Extract the contents of this foundation pack into the repository root. Do not keep the outer `mourneveil-foundation-pack` folder inside the repository.

Check:

```powershell
git status --short
```

## Create the governance commit

```powershell
git add .
git commit -m "chore(repo): add project governance foundation"
git push -u origin main
```

Before committing, confirm that no credential, `.env`, personal file, or unrelated file is staged:

```powershell
git diff --cached --name-only
```

## GitHub settings

### General

Recommended:

- Default branch: `main`
- Allow squash merging: enabled
- Allow merge commits: disabled initially
- Allow rebase merging: disabled initially
- Automatically delete head branches: enabled

Squash merge keeps short-lived agent branches from producing noisy integration history.

### Ruleset for `main`

If your GitHub plan supports rulesets on this private repository:

- Target branch: `main`
- Block force pushes
- Block branch deletion
- Require a pull request before merging
- Require status checks before merging after the first CI run exists
- Required check: the check produced by `.github/workflows/ci.yml`
- Do not require multiple human approvals for a solo project
- Allow repository administrator bypass only for emergencies

If your plan does not support private-repository rulesets, follow the same policy manually. Agents still must not push or merge without explicit permission.

### Security

Enable:

- Secret scanning where available
- Push protection where available
- Dependabot alerts

Do not give an agent a broad personal access token when normal local Git authentication is sufficient.

## Run Prompt 000

Open Codex at the repository root and provide the full contents of:

`prompts/000-bootstrap-foundation.md`

Use a fresh session. Do not prepend the entire conversation history.

After Codex returns its report:

1. Do not merge yet.
2. Run `npm install`.
3. Run `npm run verify`.
4. Run `npm run dev`.
5. Inspect the page locally.
6. Send the Codex report plus your observations to the Director for review.

## Cursor setup

Open the same repository in Cursor.

Confirm that `.cursor/rules/` is visible. For important tasks, explicitly mention:

- `@AGENTS.md`
- the relevant file under `.agents/skills/`

Cursor should not modify the tree while Codex is working in it.

## Claude Code setup

From the repository root:

```powershell
claude
```

Inside Claude Code, run:

```text
/context
```

Confirm that `CLAUDE.md` loaded. It imports `AGENTS.md`.

Use Claude primarily for read-only review until a task explicitly assigns implementation.
