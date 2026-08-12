# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m10-visual-production-identity

## Status

**M10 READY FOR PRODUCT OWNER ACCEPTANCE — FINAL**

Blocking PO regressions (camera jitter + foreground occlusion) fixed and verified. No M10 tag/push in this session — await explicit PO acceptance.

## Locked decisions

- Identity remains “ruined gothic ossuary under veil-light”; ADR-0002 remains the world-object authoring law.
- Camera follow is owned by one presentation path: sim player → damped look-ahead → damped lookAt → rigid offset.
- Occlusion is presentation-only on `occlusionPolicy: 'fade'` placements + gate bars; gameplay colliders unchanged.
- D-005 resolved: ConnectedLevelVisual no longer double-draws wall/blocker/floor proxies by default.

## Final stabilization (this session)

### Camera jitter

- Root cause: MB6 raw `player.facing` look-ahead snapped on facing flips / wall-slide / idle.
- Fix: velocity-steered look-ahead with deadzones; angle-lerp damping; idle keeps prior direction.
- Gate: `gate:m10-camera-stability` PASS (bounded lookAt steps, low reversals across locomotion cases).

### Foreground occlusion

- Root causes: (1) ConnectedLevelVisual graybox wall proxies double-drew with production shell; (2) thin camera→player ray missed neighboring divider bays; (3) `silhouette.refuge.south` sat in-camera at the southern detour.
- Fix: collider-only proxies (gates keep mesh); corridor + thin-wall plane occlusion → sink fade instances; relocate south silhouette far-field.
- Gate: `gate:m10-occlusion-readability` PASS including divider player cyan glow (cyan=206).

### Perf (post-fix, hero/route)

| Metric | MB6 baseline | After stabilization |
| --- | ---: | ---: |
| Draw calls | ~294–307 | ~258–275 |
| Triangles | ~23–24k | ~22.5–23.1k |
| Geometries | ~129–137 | ~116–128 |
| Meshes | 228 | 215 |
| Lights | 10 | 10 |

## Verification (session)

- Unit: followCamera, cameraOcclusion, occlusionPlacementState PASS
- `npm run lint` / `typecheck` / `test` (363) / `build` / `verify` PASS
- M10: camera-stability, occlusion-readability, hero-visual, perf-baseline, ui-compact PASS
- M9: player-combat, guard-depth, hit-reaction, telegraph-readability PASS (re-run perf/M8 if port contention)
- `gate:lifecycle` PASS
- LeanLoop doctor --strict / sync --check PASS
- git_guard dirty (expected; uncommitted stabilization WIP)

## Not done / PO

- No `v0.10` / M10 tag
- No push
- No M11 implementation started
- Canonical next milestone: **M11 Boss Vertical Slice** (roadmap)

## Next

1. Product Owner visual acceptance of divider + movement camera.
2. On accept: tag per repo convention, then open M11 plan.
