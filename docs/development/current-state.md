# Current State

- Updated: 2026-08-09
- Milestone: **M4 Core RPG Loop — IN PROGRESS**
- Active LeanLoop task: `m4-core-rpg-loop`
- Status: M3 Product Owner accepted. M4.1–M4.3 complete: canonical health/death, one checkpoint/respawn loop, and committed healing flask. M4.4 not started.

## What exists

- Accepted M2 Combat Proof
- M3 enemy definition/runtime authority, melee proof, facing/spacing/steering, liveness fix
- Data-driven skirmisher + brute roles; per-enemy collision/contact state
- Mixed graybox encounter lifecycle (`active` → `complete`) with fixture reset
- Canonical player health/death with simulation-owned checkpoint respawn and deterministic mixed-encounter reset
- Three-charge committed healing flask (E); checkpoint interaction/rest and respawn refill it
- Local Vite endpoint `http://127.0.0.1:4173/`
- CI: Node 22 → `npm ci` → `npm run verify`

## Known limitations

- Local steering only (no navmesh/A*/crowd/flanking)
- No waves/loot/XP/inventory/equipment/save/production HUD
- Controller deferred
- M4.1–M4.3 browser interaction matrix unverified this session because no in-app browser backend was available
- Vite main-chunk >500 kB advisory non-blocking
- Spacing hysteresis band intentionally holds without attacking between stop and resume ranges

## Next executable work

M4.4 loot pickup proof, followed by M4.5 equipment proof and M4.6 versioned local save/M4 verification. M4.4 was not started in this batch.
