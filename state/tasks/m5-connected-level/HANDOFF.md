# HANDOFF

Updated: 2026-08-10 by Cursor
Task: m5-connected-level

## Status

**M5.6.1 PASS.** M5 READY FOR PRODUCT OWNER ACCEPTANCE. Do not tag, push, or start M6 until PO accepts the corrected build.

## M5.6.1 — Connected-level correctness repair

### Collision A (watch-column) + B (approach-cairn)

- Root cause: M5.4 landmarks were **visual-only** meshes with no matching Rapier colliders (`CONNECTED_LEVEL_LANDMARKS` missing from collider set).
- Secondary: defeated enemy capsules stayed **solid**, trapping the player against corpses near the watch-column spawn.
- Fix: landmarks authored once in `connectedLevelCollision.ts` and shared by visuals + physics; defeated enemies disable body/hurtbox colliders; player RigidBody syncs authoritative transform each frame.
- Authoring: `horizontalFootprintOverlapsSolid` + `connectedLevelAuthoring.test.ts`; moved open `connection.arrival-first-combat` to `(-11, 5)` out of `wall.arrival-choke`.
- Regression: Rapier landmark integration tests; browser `gate-m561-correctness.mjs` A/B PASS (stop at solid faces).

### Mouse aim (C)

- Root cause (first incorrect stage): **presentation yaw**. `PlayerVisual` used `atan2(facing.x, -facing.z)` instead of `localNegativeZFacingYaw` (`atan2(-facing.x, -facing.z)`), so local −Z / contact marker pointed opposite for ±X aim. Authoritative execution facing was already correct.
- Secondary: aim plane now at player Y; projection refresh before raycast.
- Browser: cardinals + diagonals + pointer re-aim + Details/resize PASS.

### Automatic HP drain (D)

- Exact source: `enemy.skirmisher.introduction` melee after zone activation at watch-column (~1.05 m), while player was clipped inside the **non-colliding** landmark (looked safe; LOS was clear through empty air).
- Occlusion + landmark colliders block through-prop hits; soak at column footprint keeps HP stable when LOS is blocked.
- Not fixed with invulnerability/clamps.

### Encounter / navigation

- Activation + egress leash unchanged and still green (`gate-m531`).
- Authored routes validated outside solids; open arrival connection offset; gated/shortcut anchors validated when open.

### Browser evidence

- `gate-m561-correctness.mjs` PASS
- `gate-m531-correctness.mjs` PASS
- `gate-m54-readability.mjs` PASS
- `gate-m55-tuning.mjs` PASS (re-run alone after one flaky sequential fail)
- `gate-m56-playthrough.mjs` PASS

## Remaining limitations

- Authored anchors/detours only — not navmesh/A*
- Controller deferred; no M6 presentation
- Vite main-chunk >500 kB advisory remains non-blocking

## Commits (this step)

- pending: `fix(world): restore connected level gameplay correctness`

## Next action

Product Owner acceptance of corrected M5. After accept + push, PO creates tag `v0.5.0-connected-level`. Do not start M6.
