# Mourneveil

Mourneveil is the working title for a local-first, browser-based 3D action RPG vertical slice.

## Current phase

Milestone **M2 Combat Proof** is Product Owner accepted. Active work is **M3 Enemy Framework** (planning complete; M3.1 not started). See `docs/development/current-state.md` and `PLAN.md`.

## Requirements

- Node.js 22
- npm 10 or newer

## Local setup

```powershell
npm install
npm run dev
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/). The Vite server is pinned to that host and port. No environment variables or external services are required.

## Commands

- `npm run dev` starts the local Vite development server at `http://127.0.0.1:4173/`.
- `npm run lint` checks source and configuration files with ESLint.
- `npm run typecheck` checks TypeScript without emitting files.
- `npm run test` runs the Vitest suite once.
- `npm run test:watch` runs Vitest in watch mode.
- `npm run build` type-checks and creates a production build in `dist/`.
- `npm run verify` runs lint, typecheck, tests, and build in order.

Read `AGENTS.md` and `STACK.md` before making repository changes. Active plan: `PLAN.md`. Milestone summary: `docs/development/current-state.md`.
