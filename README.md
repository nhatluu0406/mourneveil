# Mourneveil

Mourneveil is a local-first browser-based 3D action RPG vertical slice focused on deliberate combat, readable enemies, and reliable recovery after failure.

## Status

- Latest Product Owner–accepted tag: **`v0.9.0-combat-depth`** (M9 Combat Depth)
- Active milestone: **M10 Visual Production & Identity** (`m10-visual-production-identity`)

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

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/). Host and port are pinned. No environment variables or external services are required.

## Verification

- `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`
- `npm run verify` — full local repository gate

## Canonical documents

- `AGENTS.md` / `STACK.md` — project law and source-of-truth order
- `PLAN.md` — **active milestone execution graph only**
- `state/tasks/<slug>/` — active and historical LeanLoop task HANDOFFs
- `docs/roadmap.md` — directional long-term release trains
- `docs/development/current-state.md` — short milestone snapshot
