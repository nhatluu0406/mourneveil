# HANDOFF

Updated: 2026-08-11 by Cursor
Task: m7-animation-character-feel

## Status

**READY FOR PRODUCT OWNER ACCEPTANCE.** M7.0–M7.6 complete on `main`. Agent does **not** self-accept. M8 not started.

## Locked authority (unchanged)

- Gameplay fixed-step state drives typed presentation intent.
- Animation never advances combat, movement, invulnerability, contact, damage, or recovery.
- Gameplay transforms remain authoritative; procedural and future GLTF animation are in-place presentation backends.
- Enemy presentation facing consumes the same accepted `attackExecutionFacing` snapshot as contact authority.

## M7.4.1 collision

- Root cause: Rapier character controller queried a stale broadphase while R3F auto-stepped kinematic bodies → soft capsule overlap into authored solids (clearance often 0.1–0.24 vs radius 0.35).
- Fix: `Physics paused`; explicit `CuboidCollider` half-extents matching authored size; `world.step()` before `computeColliderMovement`; final-divider endpoint overlaps; wall continuity validator (southern detour gap allowed).
- Gate: `scripts/browser/gate-m741-collision.mjs` PASS (clearance ≈ 0.370).

## M7.5 / M7.6 animation

- Tuned player idle/locomotion/attacks/guard/dodge/heal/death; skirmisher vs brute cadence.
- Gate: `scripts/browser/gate-m76-animation.mjs` PASS; wall clearance retained after animation work.

## Verification

- 258 tests PASS (isolated vitest after Windows pool exhaustion)
- lint / typecheck / build / doctor / sync PASS
- M5.6.1 + M6.7 collision regressions PASS

## Known limitations

- Procedural low-poly only (no production GLTF packs)
- Cosmetic weapon/limb clipping through walls possible at camera distance
- Keyboard + mouse primary; controller deferred

## Next action

Product Owner acceptance of M7. Do not start M8 until accepted.
