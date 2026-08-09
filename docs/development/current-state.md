# Current State

- Updated: 2026-08-09
- Milestone: **M3 Enemy Framework — M3.1 through M3.3 complete; M3.4 next**
- Active LeanLoop task: `m3-enemy-framework`
- Status: One authoritative deterministic melee enemy now proves readable execution-facing attacks, authored melee spacing/hysteresis, collision-safe local graybox steering, bidirectional contact, defense interaction, and defeat.

## What exists

- Accepted M2 Combat Proof (aim/contact/dodge/guard + browser matrix)
- M3.1 enemy authority, M3.2 first melee proof, and M3.3 facing/navigation/spacing correctness
- Narrow deterministic player combat health for enemy incoming-melee proof only
- Local Vite endpoint `http://127.0.0.1:4173/`
- CI: Node 22 → `npm ci` → `npm run verify`

## Known limitations

- Local steering handles the current convex graybox blocker and boundaries but has no route memory, navmesh, or guarantees for concave/maze layouts
- Full player death/respawn, healing, RPG stats, production health HUD, and broader health systems remain prohibited/deferred
- No controllable browser backend was available for the M3.3 visual/input matrix; local endpoint returned HTTP 200 and automated simulation/Rapier tests passed
- Controller play-pass and production VFX/animation remain deferred
- Bundle-size advisory non-blocking

## Next executable work

M3.4 — Enemy role variants. Do not start without a new authorized batch.
