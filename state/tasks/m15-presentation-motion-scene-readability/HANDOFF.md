# HANDOFF

Updated: 2026-08-15 by Codex
Task: `m15-presentation-motion-scene-readability`

## Status

ACTIVE — **M15 MB4 READY FOR PRODUCT OWNER VISUAL REVIEW**. M15 is not closed or tagged. Do not start M16.

## MB4 visual reset

- Rite I compiles one 32×17 m architectural envelope: one foundation and exterior shell with eight logical rooms partitioned inside it. Gameplay zones, connections, encounters, checkpoint, shortcut, final gate, and boss sequence are unchanged.
- Exterior walls use a heavier modular type; interior wall spans/openings remain compiler-derived. Disconnected room perimeter shells and legacy silhouette masses were removed.
- The pipe-like arch became a grounded pointed threshold. The cyan combat monolith, sarcophagi, shrine, and ordinary fixtures were reduced to actor-scale forms.
- Shared floor/wall/recess values were separated without raising global exposure. Cyan remains an accent; warm practicals define navigation pools.

## Character and motion presentation

- Warden hierarchy is root → pelvis/torso → thigh/shin/foot and upper-arm/forearm chains. The compact mourner silhouette uses a cowl, layered armor/tabard, one asymmetrical shoulder, cloak, articulated limbs, and compact weapon.
- Distance-owned gait remains presentation authority. Pose projection adds opposed thigh swing, loading/swing knee flexion, ankle/toe articulation, arm opposition, pelvis yaw, and restrained weight shift. Idle/blocked locomotion does not advance gait.
- Skirmisher and brute now project explicit stepping legs while retaining shared authoritative animation intent. Boss gameplay/presentation semantics are unchanged.
- No root motion, gameplay speed, collision shape, contact timing, AI, or action authority changed.

## Physicality

- Object intent is derived from canonical definitions as `hard-physical`, `soft-dressing`, or `vfx`.
- Hard brazier, broken reliquary, and reduced monolith use compiler-derived declarative box collision. Offset metadata aligns proxies to visible bases.
- Small rubble is soft/non-snagging. Wall visual instances do not duplicate compiler-owned structural wall colliders.
- Checkpoint interaction/respawn anchors and collider authority are unchanged.

## Lighting and render policy

- Default route uses ambient + hemisphere + directional source lighting with zero shadow-casting lights; actor contact patches provide cheap grounding.
- Up to five authored PointLights explain selected practical pools. Other fixtures are emissive/instanced and do not cast dynamic shadows.
- Development `?m15Shadows=1` is the measured directional-shadow A/B only.
- Ordinary static architecture, practical fixtures, and small dressing do not cast dynamic shadows. Actors and explicit landmarks remain shadow-capable for scoped future views.
- Instanced world groups use normal frustum culling; non-photometric fixture variants are instanced; wall colliders are compiler-merged.

## Performance evidence

Baseline observed at MB4 start: 227 draws / 13,961 triangles / 429 objects / 242 meshes / 7 lights / about 86 MB heap.

Representative quality route after reset: 78 draws / 3,136 triangles / 377 objects / 209 meshes / 6 lights. Art-review Court sample at DPR 1: 94 draws / 4,184 triangles / 391 objects / 214 meshes / 8 lights (5 PointLights) / 0 active shadow casters / 123 MB reported heap.

Same-scene A/B from `tmp-m15-art-reset/performance-ab.json`:

- DPR 1, shadows off: 94 draws; p50 80.8 ms; p95 273.0 ms.
- DPR 1, shadows on: 181 draws; 97 active caster meshes; p50 105.9 ms; p95 198.5 ms.
- Capped renderer DPR 1.35 on a 1.5 device scale: 94 draws; p50 153.2 ms; p95 324.2 ms.
- `EXT_disjoint_timer_query_webgl2` was unavailable; no GPU milliseconds are claimed. Playwright-host CPU timing is noisy and only same-host A/B evidence.
- Draw/triangle targets passed. Object target 330 and mesh target 200 were not met (representative 377/209; staged 391/214).

## Evidence

- Screenshots: `tmp-m15-art-reset/01-outer-watch-before.png` through `16-1280-gameplay.png`.
- `01` is a same-build MB3 camera/profile baseline, not a historical pre-commit render; use Git/runtime history for the true old-art comparison.
- Motion: `tmp-m15-art-reset/17-motion-evidence.webm` and `tmp-m15-motion-quality/after.webm`.
- Inspection: continuous floor/exterior mass, readable partitions/openings, compact shrine/landmarks, opaque camera-safe architecture, articulated Warden gait, role-readable enemies, and no page errors. Feet articulate through contact/passing/toe-off; Product Owner feel acceptance remains required.

## Verification

- Focused world/physics/render tests: 188 passed.
- `npm run verify`: lint (one pre-existing GateBars hook warning), typecheck, 112 test files / 486 tests, assets, and production build passed. Vite retains the known large-chunk advisory.
- M15 gates: world integrity, room architecture, occlusion, motion quality, quality audit, session flow, Armory/Oath UI, and art reset passed.
- Regressions: M14 itemization/loot/art; M13 skills/progression; M12 alpha; M11 boss foundation/visual; M10 camera/occlusion; lifecycle passed.

## Remaining Cursor technical blockers

- Product Owner-reported wall snag/stick behavior remains unresolved and outside this art batch. Passing collision probes do not overrule the runtime report; Cursor should reproduce exact coordinates and inspect Rapier stepping/controller resolution.
- Authoritative movement speed/acceleration/game-feel tuning remains Cursor-owned.
- D-004 bundle-size warning remains unchanged.

## Next

Product Owner visual review of MB4 screenshots/video. If accepted, route the next technical batch to Cursor for wall-snag reproduction and movement feel; keep M15 active until separately authorized to close.
