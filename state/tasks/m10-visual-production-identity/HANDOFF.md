# HANDOFF

Updated: 2026-08-12 by Codex
Task: m10-visual-production-identity

## Status

ACTIVE — M10 macro-batch 1 hero screenshot slice PASS; M10 remains open for Product Owner visual review and later visual-production work.

## Locked decisions

- Visual identity is “ruined gothic ossuary under veil-light”; project-authored assets only in this batch.
- Visuals consume M7/M9 state and never alter movement, contact, damage, timing, or physics authority.
- Default-playable visual acceptance is based on the composed 1440×900 hero view; proof fixtures remain isolated.
- Code-native production assemblies have stable IDs/provenance in `productionVisualLedger.ts`; imported assets continue through the M8 manifest.
- Imported production ceilings are 2 MiB/asset and 12 MiB total; proof assets retain explicit 64 KiB limits.

## M9 closure

- Product Owner acceptance recorded in commit `e7d8204`.
- Annotated tag `v0.9.0-combat-depth` points to that verified closure commit.

## Production slice

- **Player:** `actor.player.veilbound-warden`; tapered layered armor, hood/mask, asymmetric shoulder, cloak/tabard, cyan charm; existing M7 pose semantics retained.
- **Weapon:** `weapon.player.oathblade`; authored compact profile, guard/grip, presentation-only length independent from contact reach.
- **Skirmisher:** `enemy.skirmisher.veil-riven`; lean tapered body, faceted mask, asymmetric limbs, authored blade; rejected M8 proof GLB remains isolated.
- **Brute:** `enemy.brute.ossuary-bulwark`; secondary silhouette pass with broad tapered mass, faceted armor, heavy weapon; gameplay role unchanged.
- **World:** `world.kit.ossuary-hero`; bevelled collider-matched solids plus non-blocking radial paving, funerary markers, practicals, metal inlay, instanced rubble, and shrine mantle.
- **VFX/UI:** opt-in debug contact volumes; production veil hit/guard cues; funerary HUD framing; no new effect framework.

## Visual direction and performance

- Canonical direction: `docs/art/visual-direction.md`.
- Before: 138 draw calls, 1,704 triangles, 83 geometries, 3 textures, 3 programs, 225 objects, 126 meshes, 9 lights, ~81 MB heap.
- After: 206 draw calls, 31,959 triangles, 103–105 geometries, 3 textures, 5 programs, 283 objects, 171 meshes, 8 lights, ~72–92 MB heap.
- M10 ceilings: 280 draw calls, 75k triangles, 150 geometries, 16 textures, 12 programs, 400 objects, 240 meshes, 9 lights, 160 MB heap.
- Resource soak: geometry/texture/mesh deltas 0/0/0 after repeated combat.

## Runtime evidence

- `gate:m10-hero-visual` captures checkpoint, player/skirmisher, heavy impact, and guard-break frames at 1440×900; `KEEP_ARTIFACTS=1` retains `tmp-m10-hero-visual` for review.
- Retained frames were inspected: silhouette/material/lighting/VFX/HUD changes are present and materially exceed the prior box proof; scene remains deliberately dark but actors and combat cues read.
- M8 stabilization proves spawn/rest/respawn, three close-wall Oathblade views, obstacle detour, default skirmisher backend, and unchanged attack damage.
- In-app browser discovery returned no available browser; repository-owned Playwright gates supplied runtime evidence.

## Debt

- D-001 removed after its production player/weapon revisit trigger: tested wall orientations show no glaring long-placeholder penetration.
- D-002–D-004 remain unchanged.

## Verification

- Focused render/asset/world/enemy/save/character/lifecycle tests: 47 files / 192 tests PASS.
- Full `npm run verify`: lint, typecheck, 78 files / 333 tests, assets, and production build PASS.
- Hero, M8 stabilization, all M9 combat/readability, M9 performance, and lifecycle gates PASS.
- Final artifact audit: no `tmp-m*` directories remain.
- Final process audit: no gate-owned Vite/Chromium process; ports 4173/4191/4192/4195/4196/4197 reusable. The Codex browser-control runtime process was not gate-owned and was intentionally left untouched.

## In flight

- None after the atomic M10 macro-batch commit.

## Known traps

- M8 proof skirmisher GLB is not Product Owner-accepted playable art.
- `KEEP_ARTIFACTS=1` is review-only; final task state must remove retained `tmp-m*` folders.

## Next session starts with

1. Product Owner reviews the retained-on-demand hero frames, then prioritize remaining M10 gaps by screenshot impact.
