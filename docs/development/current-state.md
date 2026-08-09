# Current State

- Updated: 2026-08-09
- Milestone: **M3 Enemy Framework — M3.3.1 / M3.4 / M3.5 complete; M3.6 next**
- Active LeanLoop task: `m3-enemy-framework`
- Status: Data-driven skirmisher + brute graybox roles share one melee runtime; mixed encounter completes when both are defeated; liveness stall after player defeat is fixed.

## What exists

- Accepted M2 Combat Proof (aim/contact/dodge/guard + browser matrix)
- M3.1–M3.3 enemy authority, melee proof, facing/spacing/steering
- M3.3.1 liveness fix (enemy AI no longer gated off when player defeated)
- M3.4 skirmisher + brute role packages; per-enemy collision/contact state
- M3.5 mixed graybox encounter lifecycle + role-readable presentation
- Narrow deterministic player combat health for enemy incoming-melee proof only
- Local Vite endpoint `http://127.0.0.1:4173/`
- CI: Node 22 → `npm ci` → `npm run verify`

## Known limitations

- Local steering handles the current convex graybox blocker and boundaries but has no route memory, navmesh, or guarantees for concave/maze layouts
- Full player death/respawn, healing, RPG stats, production health HUD, and broader health systems remain prohibited/deferred
- No waves/director/loot/XP; encounter is a fixed two-enemy fixture
- Controller play-pass and production VFX/animation remain deferred
- Bundle-size advisory non-blocking

## Next executable work

M3.6 — M3 verification / Product Owner acceptance gate. Do not start without authorization.
