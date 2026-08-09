# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Codex
Task: m3-enemy-framework

## Status
M3.1, M3.2, and M3.3 complete on `main`. M3.4 has not started.

Classification: **M3.3 PASS WITH BROWSER LIMITATION · M3.4 NEXT**

## Exact enemy-facing root cause
- Authoritative contact was centered at `enemy.position + executionFacing * forwardOffset` and was directionally correct.
- `EnemyVisual` rotated its local `-Z` markers with `atan2(facing.x, -facing.z)`. A local `-Z` vector under that yaw maps to `(-facing.x, facing.z)`, so east/west presentation was mirrored while north/south appeared correct.
- M3.2 also preserved attack direction only by freezing live enemy facing; that was behaviorally stable but did not make execution-facing a separate authoritative value.

## Execution-facing fix
- `EnemyRuntime` now stores `attackExecutionFacing` only when an action request is accepted, from authoritative player minus enemy position.
- Startup, active, and recovery retain that snapshot; player movement and pursuit facing cannot rotate it. It clears after recovery before spacing resumes.
- Telegraph presentation and contact projection consume `EnemyAttackSpatialSnapshot.executionFacing`; local `-Z` yaw is `atan2(-x, -z)`.
- Guard evaluates the authoritative incoming direction as the inverse of the same attack snapshot. Dodge remains simulation-phase invulnerability.

## Pursuit and spacing policy
- Authored `stoppingRange` is 1.28 m; pursuit translation clamps to the remaining stand-off distance.
- Authored `attackRange` is the 1.48 m pursuit-resume threshold.
- Recovery enters explicit `spacing`: inside the hysteresis band the enemy holds position without state flapping, inside stopping range it accepts a new attack, and beyond resume range it pursues.
- Pursuit remains bounded at 2.1 m/s, fixed-step, valid-direction-only, and defeated enemies cannot move.

## Obstacle behavior
- Rapier remains collision authority. Direct pursuit is used while it retains at least 60% of requested horizontal travel.
- When materially blocked, simulation probes both deterministic 45-degree steering directions, uses stable entity-ID tie order, and selects the collision-corrected step with best movement/forward progress.
- Real Rapier tests prove routing around the center blocker, perimeter containment with recovery toward a changed open target, and player/enemy stand-off.

## Runtime verification
- In-app browser discovery returned no available backend (`[]`), so cardinal approach, bait/behind, re-aim, spacing, blocker/border, defense, defeat, and console observations remain manual.
- Local Vite endpoint `http://127.0.0.1:4173/` returned HTTP 200; the temporary server was stopped.

## Verification
- Focused M3.3/M3.2/M2/M1 impact set: 20 files, 101/101 tests.
- Full suite: 29 files, 130/130 tests.
- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`: pass.
- `npm run verify`, `git diff --check`, `doctor.py --strict`, and `sync.py --check`: pass.
- Known non-blocking build advisory: main chunk exceeds 500 kB.

## Known navigation limitations
- Local steering has no route memory and is intended only for the current open graybox with simple convex obstacles.
- No navmesh, A*, maze/concave-route guarantee, multi-agent avoidance, flanking, or crowd behavior exists.

## Next
M3.4 — Enemy role variants, only under a new authorized batch. Do not start M3.4 in this session.
