# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Cursor
Task: m3-enemy-framework

## Status
M3.3.1, M3.4, and M3.5 complete on `main`. M3.6 has not started.

Classification: **M3.3.1 PASS · M3.4 PASS · M3.5 PASS · M3.6 NEXT**

## Exact liveness root cause (M3.3.1)
- `PlayerRuntime.advanceFrame` only called `advanceMeleeEnemy` while `playerAlive` was true.
- After the player was defeated by enemy melee, the simulation clock kept running, but the enemy stopped advancing mid-attack/recovery (telegraph/contact could remain), matching the PO “pending while sim running” report.
- Secondary soft-locks: pursue with null collision resolver/facing, or near-zero Rapier-corrected travel inside `attackRange`, could remain in pursue forever.

## Liveness fix
- Always advance melee enemies with `{ targetAlive: playerAlive }`.
- When the target is dead: keep advancing committed attack/recovery clocks, then drop pursue/spacing into idle (allowed `spacing → idle`).
- When blocked with ~zero step inside attack range (or missing resolver while in-band): enter spacing / accept attack instead of permanent pursue stall.
- Diagnostic milestone updated through M3.3.1 → M3.4 → M3.5 as steps landed.
- Regression tests cover target-death exit, blocked-pursue escape, multi-cycle attacks, and player-runtime defeat → idle.

## Variant architecture (M3.4)
- Shared `EnemyRuntime` + `advanceMeleeEnemy`; no per-role subclasses/state machines.
- Authored packages in `enemyRoles.ts`: skirmisher (converted former melee baseline) and brute.
- Differences come from definition/action/contact/damage/presentation data.
- Multi-enemy fixture: distinct runtime IDs, per-enemy Rapier collision resolvers, per-enemy `CombatContactRuntime` hit-dedup.

## Variant definitions
- Skirmisher: faster, 70 HP, short 18/5/18 attack, tighter spacing, smaller body, green-tint presentation.
- Brute: slower, 160 HP, long 42/8/36 telegraph, heavier damage/contact, larger body, brown-tint presentation.

## Encounter lifecycle (M3.5)
- `encounter.graybox.mixed` derives `active|complete` from the two fixture enemy alive flags.
- Completes only when both are defeated; one defeat stays `active`.
- `resetMeleeFixture` restores both enemies and returns encounter to `active`.
- No waves, director, loot, or spawning framework.

## Browser soak results
- M3.3.1: multi-cycle combat, player defeat → enemy idle while sim running, reset cycles, roam; no console errors.
- M3.4: both roles spawn; each activates when approached; no console errors.
- M3.5: extended soak with both roles live; encounter stays coherent; reset restores full health/active; no console/React errors; no obvious stutter/leak symptoms observed.

## Remaining limitations
- Local steering only; no navmesh/A*/crowd/flanking.
- Player health remains development proof only (no respawn/heal/HUD).
- Controller deferred.
- Vite main-chunk >500 kB advisory non-blocking.

## Commits this batch
- `6d709aa` fix(enemy): prevent runtime state stall
- `106d063` feat(enemy): add graybox enemy roles
- (pending) feat(encounter): add mixed enemy combat proof

## Next
M3.6 — M3 verification / PO acceptance. Do not start M3.6 in this session without a new authorized batch.
