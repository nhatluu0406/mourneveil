# Current State

- Updated: 2026-08-09
- Milestone: **M3 Enemy Framework — M3.1 and M3.2 complete; M3.3 next**
- Active LeanLoop task: `m3-enemy-framework`
- Status: One authoritative deterministic melee enemy now proves distance aggro, collision-resolved pursuit, fixed-step attack timing, bidirectional melee contact, defense interaction, and defeat.

## What exists

- Accepted M2 Combat Proof (aim/contact/dodge/guard + browser matrix)
- M3.1 enemy definition/runtime/state authority and M3.2 first melee enemy proof
- Narrow deterministic player combat health for enemy incoming-melee proof only
- Local Vite endpoint `http://127.0.0.1:4173/`
- CI: Node 22 → `npm ci` → `npm run verify`

## Known limitations

- M3.3 navigation/spacing work has not started; current pursuit targets an open graybox lane without pathfinding
- Full player death/respawn, healing, RPG stats, production health HUD, and broader health systems remain prohibited/deferred
- No controllable browser backend was available for the M3.2 visual/input matrix; local endpoint returned HTTP 200 and automated simulation/Rapier tests passed
- Controller play-pass and production VFX/animation remain deferred
- Bundle-size advisory non-blocking

## Next executable work

M3.3 — Enemy movement/navigation and spacing. Do not start without a new authorized batch.
