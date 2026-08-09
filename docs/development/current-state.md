# Current State

- Updated: 2026-08-09
- Milestone: **M4 Core RPG Loop — IN PROGRESS**
- Active LeanLoop task: `m4-core-rpg-loop`
- Status: M3.1–M3.6 Product Owner accepted. M4.1–M4.3 authorized as one sequential gated batch; M4.4 not started.

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

Execute PLAN M4.1, then M4.2, then M4.3 through their internal gates. Do not start M4.4 in this batch.
