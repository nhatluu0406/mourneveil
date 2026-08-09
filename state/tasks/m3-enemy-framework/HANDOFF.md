# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Codex
Task: m3-enemy-framework

## Status
M3.1 and M3.2 complete on `main`. M3.3 has not started.

Classification: **M3.1 PASS · M3.2 PASS WITH BROWSER LIMITATION · M3.3 NEXT**

## M3.1 result
- Immutable definitions own role/tags, body/hurtbox dimensions, health, movement/perception/range values, and referenced action IDs.
- Stable mutable instances own transform, velocity, state, target, shared combat-action runtime, health, hurtbox, and defeat.
- Explicit transitions are simulation-owned; defeat clears target/action/motion and forbids further normal transitions.
- Internal gate: focused enemy/combat 47/47; `npm run verify` 103/103 and build green before M3.2 began.

## M3.2 result
- One grounded graybox melee enemy owns distance detection, bounded collision-resolved pursuit, deliberate melee spacing, startup telegraph, active contact, recovery, repeat, and defeat halt.
- Attack facing is snapshotted at accepted start; the shared contact runtime owns active-window validation and per-execution target dedup.
- Player light/heavy attacks query the enemy hurtbox through existing M2 authority and apply authored damage.

## Player-health scope implemented
- Only maximum/current combat health, alive/defeated, deterministic clamped damage, stable hurtbox identity, and development fixture reset/diagnostic.
- No healing, regeneration, flask, armor, resistances, status effects, full death/respawn, production health HUD, or generalized stats.
- Zero health freezes player simulation requests/progression; no respawn/checkpoint behavior exists.

## Contact and defense policy
- Enemy outgoing contact uses the shared Rapier sphere-query contract and one hit/result per player per execution; a new execution may resolve again.
- Authoritative dodge active phase resolves overlap as `dodged` with zero damage.
- Guard blocks with zero damage only inside the single authoritative 120° forward cone; rear/outside-cone contact damages normally.
- Defeated enemies expose no outgoing contact and cease behavior/action progression.

## Browser verification
- In-app browser setup returned no available browser backends, so the 15-point visual/input matrix and console inspection are unverified.
- Local Vite endpoint returned HTTP 200. Pure simulation, PlayerRuntime integration, and real Rapier collision/contact tests are green.

## Verification
- Focused M3/M2/Rapier: 71/71.
- M1 movement/collision/input/camera regressions: 13/13.
- Full suite: 118/118.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run verify`, and `git diff --check`: pass.
- Known non-blocking build advisory: main chunk exceeds 500 kB.

## Next
M3.3 — Enemy movement/navigation and spacing, only under a new authorized batch. Preserve current authority and do not add a navmesh without evidence.
