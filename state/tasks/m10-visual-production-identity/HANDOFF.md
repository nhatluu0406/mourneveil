# HANDOFF

Updated: 2026-08-12 by Codex
Task: m10-visual-production-identity

## Status

ACTIVE — M10 macro-batch 2 ossuary environment production slice PASS; M10 remains open and untagged.

## Locked decisions

- Identity remains “ruined gothic ossuary under veil-light”; all new geometry/materials are original project-authored work with no external textures.
- `connectedLevelCollision.ts` remains the full gameplay geometry authority. The environment kit is a non-blocking visual shell or is anchored over an existing proxy; gates consume authoritative flags but never author them.
- M10.1 actor, animation, contact, VFX, HUD, asset, and budget contracts remain unchanged.
- Seven inspected 1440×900 route frames, gameplay gates, and renderer growth are the acceptance boundary.

## Environment production slice

- **Kit:** irregular funeral slabs/inlays; two wall-bay rhythms; broken wall crowns; shallow buttresses; recessed tomb niches with bronze arches; full rib arches/doorway rhythm; raised thresholds; sarcophagi/funerary slabs; markers; reliquary plinth; instanced rubble/masonry; iron gate bars; candles, cloth, roots, and veil wisps.
- **Refuge:** shrine crown, radial rest focal, sarcophagi/markers, controlled candles and warm/cyan light retain safe-sacred identity and canonical checkpoint anchors.
- **Corridor:** paired bone ribs, bell, slanted verdigris thresholds, compressed clutter edges, and warm directional practicals guide toward combat.
- **Outer Watch:** wider irregular slab field, niche/buttress wall rhythm, open center, rear veil monolith, and collider-matched reliquary plinth distinguish the combat space without navigation clutter.
- **Landmarks:** `landmark.refuge-reliquary-crown`; `landmark.combat-veil-monolith` on the rear watch-column proxy. The latter was moved after screenshot review so it does not occlude actor combat.
- **Gates:** closed shortcut/final gate cuboids render as burial bars; their CuboidCollider and simulation-owned open state remain unchanged.
- **Lighting/atmosphere:** 9-light ceiling retained; cool global key, cyan combat focus, warm corridor/refuge counterpoint, existing fog, and four cheap presentation-only wisps.

## Runtime evidence

- `gate:m10-hero-visual` now captures: `01-refuge-wide`, `02-refuge-actor-close`, `03-corridor-composition`, `04-first-combat-composition`, `05-combat-telegraph`, `06-hit-interrupt-cue`, `07-progression-landmark`.
- `KEEP_ARTIFACTS=1 npm run gate:m10-hero-visual` retains them under `tmp-m10-hero-visual/`; normal runs clean the directory.
- All seven retained frames were inspected. Wall rhythm, distinct floor treatment, the two landmarks, gate bars, actor separation, telegraph, and hit cues are visible; the combat center remains clear.

## Performance

- Before (M10.1): 206 draw calls, 31,959 triangles, 103–105 geometries, 3 textures, 5 programs, 283 objects, 171 meshes, 8 lights, ~72–92 MB heap.
- After: 220 draw calls, 35,059 triangles, 102 geometries, 3 textures, 9 programs, 266 objects, 159 meshes, 9 lights, ~91.7 MB heap at DPR 1.
- All M10 ceilings pass. Repeated combat deltas: geometries 0, textures 0, meshes 0.
- Instancing owns slabs, inlays, bays, recesses, buttresses, sarcophagi, rubble, markers, candles, banners, roots, and wisps.

## Verification

- Focused render/real-Rapier collision/checkpoint/navigation: 25 files / 100 tests PASS.
- Assets import/verify PASS.
- Hero, M8 stabilization, M9 player combat/guard/hit-reaction/telegraph, M9 performance, and lifecycle gates PASS.
- Full `npm run verify`: lint, typecheck, 79 files / 337 tests, asset verify, and production build PASS.
- `git diff --check`, LeanLoop doctor/sync, Git guard, and final process/artifact audit PASS.

## Debt and limits

- D-002–D-004 remain valid; no new cross-milestone debt.
- Distant perimeter, mixed court, ash walk, and final arena still use more M5/M10.1 block language; this is active M10 scope, not debt.
- Texture-free material hierarchy is intentionally retained; authored stone/cloth textures should be introduced only if a measured later screenshot pass earns their runtime cost.

## Next session starts with

1. Rank the mixed-court/final-approach environment, material surface refinement, and distant silhouette work by screenshot impact.
