# Current State

- Updated: 2026-07-28
- Milestone: M0 — Project Foundation
- Status: implementation complete; Product Owner local verification required before acceptance

## Repository structure

The implemented runtime foundation is:

- `src/app/`: React bootstrap, application shell, renderer error boundary, and global styles
- `src/render/`: React Three Fiber scene projection and mounted Rapier world
- `src/game/core/`: pure foundation diagnostic contract and focused test
- `src/debug/`: HTML diagnostic panel
- `.github/workflows/ci.yml`: Node 22 continuous verification

The existing product, architecture, governance, prompts, and shared skill documentation remains canonical.

## Requirements and dependencies

- Node.js 22
- npm 10 or newer
- npm lockfile committed for deterministic installation
- Runtime: React, Three.js, React Three Fiber, Drei, and React Three Rapier
- Tooling: Vite, TypeScript strict mode, ESLint, and Vitest

No environment variables or external services are required.

## Commands

- `npm install`: install dependencies for local development
- `npm ci`: install exactly from `package-lock.json`, as used by CI
- `npm run dev`: start the local Vite server
- `npm run lint`: run ESLint
- `npm run typecheck`: run TypeScript checks without emitting
- `npm run test`: run Vitest once
- `npm run test:watch`: run Vitest in watch mode
- `npm run build`: type-check and create the production bundle
- `npm run verify`: run lint, typecheck, test, and build in that order

## Runtime behavior

The application fills the browser window with a React Three Fiber canvas using a stable high-oblique camera. The M0 scene contains basic lighting, a procedural platform, and a primitive box. Both meshes have fixed Rapier rigid bodies.

An HTML diagnostic panel identifies Mourneveil and Milestone M0. Renderer readiness is reported by the canvas creation callback. Physics readiness is reported only by a child mounted inside the initialized Rapier context. A React error boundary and the canvas fallback keep a readable message available if 3D renderer initialization fails.

There is no movement or gameplay.

## Verification

On 2026-07-28:

- `npm install`: passed; 238 packages audited, 0 vulnerabilities
- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed; 1 test file and 1 test
- `npm run build`: passed; Vite emitted a non-failing initial-bundle size advisory
- `npm ci`: passed; 237 packages installed from the lockfile, 0 vulnerabilities
- `npm run verify`: passed in the required lint, typecheck, test, build order
- `npm run dev -- --host 127.0.0.1`: launched at `http://127.0.0.1:5173/`
- HTTP request to the development server: passed with status 200

## Current limitations

- Product Owner local browser verification is still required before M0 acceptance.
- Automated browser testing is intentionally not installed for M0.
- The initial Three.js and Rapier production bundle triggers Vite's chunk-size advisory; optimization is deferred until profiling provides a concrete target.
- No gameplay, input, audio, persistence, production assets, backend, deployment, or analytics exist.

## Next task

After Product Owner M0 verification, plan M1 around one deterministic simulation-clock and input-intent foundation. Define acceptance criteria before implementing movement or a character controller.
