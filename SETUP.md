# Local Setup

Mourneveil is a public, local-first repository maintained by one Product Owner. No account, environment variable, backend, cloud service, or GitHub ruleset is required for local development.

## Prerequisites

- Git
- Node.js `>=22.12.0 <23`
- npm `10.9.2`

Verify the toolchain:

```powershell
git --version
node --version
npx --yes npm@10.9.2 --version
```

## Clone and install

```powershell
git clone https://github.com/nhatluu0406/mourneveil.git
cd mourneveil
npx --yes npm@10.9.2 ci
```

`npm ci` is the canonical install. Do not regenerate `package-lock.json` with another npm version.

## Verify and run

```powershell
npx --yes npm@10.9.2 run verify
npx --yes npm@10.9.2 run dev
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/).

Individual checks are available as `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

## Repository workflow

Read `AGENTS.md`, `STACK.md`, `PLAN.md`, and the active task HANDOFF before making changes. Direct work on a clean `main` is normal for the current solo workflow when the task authorizes it. Preserve unrelated work, use explicit-path commits through `scripts/leanloop/safe_commit.py`, and do not push unless the Product Owner authorizes it.

Branches or worktrees are reserved for risky experiments, parallel writers, unrelated dirty work, or changes that benefit from independent rollback and review. Project policy does not currently require a GitHub ruleset; revisit that decision if collaboration expands.
