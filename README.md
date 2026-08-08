# Mourneveil

Mourneveil is the working title for a local-first, browser-based 3D action RPG vertical slice.

## Current phase

Milestone M0 foundation is in the repo; M1 (Graybox Movement Foundation) is planned in `PLAN.md` and not yet implemented.

The repository contains the local web-game foundation: a React application shell, a React Three Fiber scene, a mounted Rapier physics world, a deterministic foundation diagnostic, and automated verification. It intentionally contains no gameplay.

## Requirements

- Node.js 22
- npm 10 or newer

## Local setup

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. No environment variables or external services are required.

## Commands

- `npm run dev` starts the local Vite development server.
- `npm run lint` checks source and configuration files with ESLint.
- `npm run typecheck` checks TypeScript without emitting files.
- `npm run test` runs the Vitest suite once.
- `npm run test:watch` runs Vitest in watch mode.
- `npm run build` type-checks and creates a production build in `dist/`.
- `npm run verify` runs lint, typecheck, tests, and build in order.

Read `AGENTS.md` and `STACK.md` before making repository changes. Active plan: `PLAN.md`. Milestone summary: `docs/development/current-state.md`.
