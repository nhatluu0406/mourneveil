# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m10-visual-production-identity

## Status

ACTIVE — M10 macro-batch 6 render consolidation + composition hardening PASS; M10 remains open and untagged.

## Locked decisions

- Identity remains “ruined gothic ossuary under veil-light”; ADR-0002 remains the world-object authoring law.
- Optimization consolidates presentation; does not strip practical lights, Mixed Court/Ash Walk, or equipment HUD.
- Cinematic HUD is presentation-only; combat/resource numbers bind to `GameRuntimeSnapshot`.
- `connectedLevelCollision.ts` remains gameplay geometry authority.

## Macro-batch 6

### Performance audit (confirmed)

| Metric | MB5 | MB6 |
| --- | ---: | ---: |
| Draw calls | 356 | ~294–307 (route) |
| Triangles | 47,144 | ~23–24k |
| Geometries | 193 | ~129–137 |
| Textures | 3 | 3 |
| Programs | 12 | 12–13 |
| Objects | 473 | 382 |
| Meshes | 283 | 228 |
| Lights | 10 | 10 |
| Heap | ~86–92 MB | ~86–92 MB |

Top fragmentation sources ranked before fix:
1. Unique `PracticalLightFixture` trees allocating per-mount geometries/materials (~80+ meshes)
2. ConnectedLevelVisual floor + zone overlays + RoundedBox walls/blockers double-drawing under ossuary shell
3. Unique landmarks with inline JSX geometries
4. Instanced dressing already efficient (~one draw/type)

Gate findings: `gate:m9-perf-baseline` measured the full mounted route but used loose sanity ceilings (450/400). MB5 `gate:m10-hero-visual` had silently raised product budgets to 380/220/650/380.

### Consolidation

- Shared/merged practical-fixture geometries + shared flame/glow materials; glow only on actual-light owners
- Skip floor/zone-plane proxy meshes; skip dressed blocker/landmark proxy meshes (collider retained) — D-005 partially mitigated
- RoundedBox → box for remaining wall proxies
- Landmark geos module-cached
- Facing look-ahead + mild closer follow offset; fog extended; cheap ash-stone perimeter silhouettes (camera-near SE + distant)
- UI audit: zone presentation already keyed; no measurable HUD thrash — no HUD redesign

### Budgets / gates

- Added `gate:m10-perf-baseline` (refuge + Mixed Court + Ash Walk + combat growth)
- Production ceilings (evidence): 320 draw / 80k tris / 160 geo / 420 objects / 250 meshes / 14 programs / 11 lights
- Measured headroom for final Codex art: ~15–25 draw calls, ~20–30 geometries, ~30–40 meshes

### Camera / composition

Root cause of dead-black: high-oblique frustum looking past authored geometry into fog/void, plus camera-near SE margins without dressing. Improved via look-ahead, closer framing, and perimeter silhouettes; some corner void remains intentional darkness and is acceptable vs stripping mood.

## Verification

- `npm run verify`: lint/typecheck/357 tests/assets/build PASS
- M9 combat/guard/hit-reaction/telegraph/perf + M10 perf/hero/UI + lifecycle PASS
- M8 stabilization: all gameplay asserts PASS; `portReusable=false` when user Vite holds default 4173 (not killed)
- No push; no M10 tag

## Next session starts with

1. **ONE final Codex visual-production macro-batch**: complete Ash Walk/sealed arena shell, lift surface richness / actor materials, establish whole-route screenshot coherence within MB6 ceilings.
2. Product Owner visual acceptance; then M10 close/tag only after acceptance.
3. Safe to add: denser authored dressing that stays instanced/shared; avoid unique multi-mesh fixtures and new light objects without pooling.
