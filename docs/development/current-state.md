# Current State

- Updated: 2026-08-09
- Milestone: **M4 Core RPG Loop — READY FOR PRODUCT OWNER ACCEPTANCE**
- Active LeanLoop task: `m4-core-rpg-loop`
- Status: M4.1–M4.6 complete (health/death, checkpoint/respawn, flask, Echoes, loot/equipment, SaveFileV1). M5 not started.

## What exists

- Accepted M2 Combat Proof and M3 Enemy Framework
- Canonical player health/death, checkpoint/respawn, healing flask
- Echoes currency with death recovery
- Authored loot → inventory → weapon/charm equipment with explicit modifiers
- Versioned local save (`SaveFileV1` / localStorage)
- Local Vite endpoint `http://127.0.0.1:4173/`
- CI: Node 22 → `npm ci` → `npm run verify`

## Known limitations

- Local steering only; no navmesh
- No leveling/XP/merchants/crafting/random loot/production HUD
- Controller deferred
- Vite main-chunk >500 kB advisory non-blocking
- Product Owner interactive acceptance pending

## Next executable work

Await Product Owner M4 acceptance. Do not start M5 until authorized.
