# Current State

- Updated: 2026-08-09
- Milestone: **M3 Enemy Framework — READY FOR PRODUCT OWNER ACCEPTANCE**
- Active LeanLoop task: `m3-enemy-framework`
- Status: M3.1–M3.6 complete on `main`. Skirmisher + brute graybox roles, liveness, facing/contact, mixed encounter, and browser soaks verified. Product Owner acceptance pending. M4 not started.

## What exists

- Accepted M2 Combat Proof
- M3 enemy definition/runtime authority, melee proof, facing/spacing/steering, liveness fix
- Data-driven skirmisher + brute roles; per-enemy collision/contact state
- Mixed graybox encounter lifecycle (`active` → `complete`) with fixture reset
- Development-only player combat health + `Reset player health` / `Reset melee fixture`
- Local Vite endpoint `http://127.0.0.1:4173/`
- CI: Node 22 → `npm ci` → `npm run verify`

## Known limitations

- Local steering only (no navmesh/A*/crowd/flanking)
- No waves/loot/XP/inventory/healing/respawn/production HUD
- Controller deferred
- Vite main-chunk >500 kB advisory non-blocking
- Spacing hysteresis band intentionally holds without attacking between stop and resume ranges

## Next executable work

Product Owner acceptance of M3. Do not start M4 until authorized after acceptance.
