# Mourneveil

Mourneveil is a local-first browser-based 3D action RPG vertical slice focused on deliberate combat, readable enemies, and reliable recovery after failure.

## Status

**M5 Connected Level** is Product Owner accepted and tagged `v0.5.0-connected-level`.

**M6 Presentation Foundation** is Product Owner accepted and tagged `v0.6.0-presentation-foundation`.

**M7 Animation & Character Feel** is active on `main` (`m7-animation-character-feel`).

## Requirements

- Node.js `>=22.12.0 <23`
- npm `10.9.2`

## Fresh clone

```powershell
git clone https://github.com/nhatluu0406/mourneveil.git
cd mourneveil
npx --yes npm@10.9.2 ci
npx --yes npm@10.9.2 run verify
npx --yes npm@10.9.2 run dev
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/). The Vite server is pinned to that host and port. No environment variables or external services are required.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run verify` — runs the complete local repository gate

Canonical project law and active state live in `AGENTS.md`, `STACK.md`, `PLAN.md`, and the active task under `state/tasks/`. `docs/development/current-state.md` is the concise milestone summary.
