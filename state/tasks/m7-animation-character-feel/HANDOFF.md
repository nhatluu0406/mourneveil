# HANDOFF

Updated: 2026-08-11 by Cursor
Task: m7-animation-character-feel

## Status

**READY FOR PRODUCT OWNER ACCEPTANCE.** M7.0–M7.6 complete on `main`. Agent does **not** self-accept. M8 not started.

Intended acceptance tag (create only after PO acceptance + push + clean tree): `v0.7.0-animation-foundation`.

## Summary

### M7.0 — Roadmap

- Long-term release trains documented; product versions describe maturity and may span milestones.
- M6 closed as Presentation Foundation (`v0.6.0-presentation-foundation`); M7 activated.

### M7.1 — Animation presentation architecture

- Typed immutable `AnimationPresentationState` projected from authoritative snapshots.
- Deterministic phase progress; backend-neutral transition contract.
- Explicit precedence: defeated > committed action > hit reaction > guard > locomotion > idle.

### Root-motion / authority policy

- Gameplay transforms remain authoritative.
- Procedural (and future GLTF) animation is in-place presentation only.
- Animation never advances combat, movement, invulnerability, contact, damage, or recovery.

### M7.2 / M7.3 — Player and enemy animation

- Player: idle, locomotion, light/heavy, guard, dodge, flask, hit reaction, defeated.
- Enemies: shared projection/pose backend; skirmisher vs brute authored cadence; frozen `attackExecutionFacing` through recovery.

### M7.4 — Integration

- Respawn/save-load derive fresh idle presentation; animation state is never serialized.
- M8 may replace procedural renderers with in-place GLTF/AnimationMixer backends on the same presentation state.

### M7.4.1 — Collision hardening

- Root cause: Rapier CC queried a stale broadphase while R3F auto-stepped kinematics → soft wall overlap.
- Fix: `Physics paused`; explicit `CuboidCollider` half-extents; `world.step()` before CC; wall continuity validator.
- Gate: `scripts/browser/gate-m741-collision.mjs` PASS.

### M7.5 / M7.6 — Feel tuning and browser acceptance

- Tuned player/enemy procedural motion for grounded weight and role identity.
- Gate: `scripts/browser/gate-m76-animation.mjs` PASS; wall clearance retained.
- Automated: 258 tests; lint/typecheck/build/doctor/sync green.

## Known limitations

- Procedural low-poly only (no production GLTF packs) — addressed by **M8 Production Asset Pipeline**
- Cosmetic weapon/limb clipping through walls possible at camera distance
- Keyboard + mouse primary; controller deferred
- Authored navigation only; two melee roles

## Next milestone

After Product Owner acceptance: **M8 — Production Asset Pipeline** (`m8-production-asset-pipeline`). Do not create that task or rewrite PLAN for M8 until acceptance.
