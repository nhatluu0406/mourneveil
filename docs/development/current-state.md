# Current State

- Updated: 2026-08-10
- Milestone: **M4 Core RPG Loop — PRODUCT OWNER ACCEPTED / CLOSED**
- Active LeanLoop task: `m5-connected-level`
- Status: M4 is closed; M5.1-M5.3 passed. M5.4-M5.6 remain; M5.4 is next and has not started.

## What exists

- Accepted M1 Graybox Movement, M2 Combat Proof, M3 Enemy Framework, and M4 Core RPG Loop
- Canonical player health/death, checkpoint/respawn, healing flask, and Echoes recovery
- Authored loot → inventory → weapon/charm equipment through canonical derived modifiers
- Versioned local save (`SaveFileV1`) behind the save service/storage boundary
- Truthful `game/runtime` session coordinator and development-only browser mutation/diagnostic surfaces
- Deterministic CI contract: Node 22 + npm 10.9.2 + clean `npm ci` + `npm run verify`
- Local endpoint `http://127.0.0.1:4173/`

## Known limitations

- Local collision-aware steering only; no navmesh
- Two proven normal melee roles; no elite or boss yet
- Connected primitive graybox level with three small encounters, one refuge checkpoint, one shortcut, and a final arena gate
- No leveling/XP/merchants/crafting/random loot/production HUD
- Controller implementation/manual acceptance deferred to later input hardening
- Vite main-chunk >500 kB advisory remains non-blocking

## Next executable work

Cursor M5.4 — Level readability and environmental composition. M5.5 tuning and M5.6 full playthrough follow sequentially.
