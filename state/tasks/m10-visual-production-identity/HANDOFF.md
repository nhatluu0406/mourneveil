# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m10-visual-production-identity

## Status

ACTIVE — M10 macro-batch 5 playable presentation PASS; M10 remains open and untagged.

## Locked decisions

- Identity remains “ruined gothic ossuary under veil-light”; ADR-0002 remains the world-object authoring law.
- Cinematic HUD is presentation-only; combat/resource numbers bind to `GameRuntimeSnapshot`.
- Product visual gates must not assume the pre-cinematic HUD or a persistent F3 hint.
- `connectedLevelCollision.ts` remains gameplay geometry authority.

## Macro-batch 5

### Practical lighting and route

- Added ADR-0002 fixture types: wall funeral sconce, plinth brazier, veil lamp, candle cluster.
- Twelve visible fixtures project five actual fixture-owned point lights; minor fixtures are emissive-only. Scene total is 10 lights; only the cool directional key casts shadows.
- Removed three generic Scene lights and the detached corridor point light. Refuge/corridor/Outer Watch/Mixed Court/Ash Walk now use visible warm/cool sources and dark transitions.
- Extended declarative floor, wall, niche, arch, marker, rubble, root, blocker-dressing, and landmark placements through Mixed Court and the Ash Walk transition. Collider authority and gameplay layout are unchanged.

### Product HUD

- Replaced six control-first slots with four canonical content slots: weapon, charm, Ashen Flask, Echoes.
- Added project-authored inline SVG glyphs. LMB/E are small item badges; RMB/Space/I are compact secondary hints; F/R remains contextual.
- Zone/objective cards expand for 3.2 seconds after presentation mount/zone change, then collapse; nearest-threat projection remains proximity-contextual.
- 1440×900 and 1280×720 screenshot gates verify content semantics, contextual Rest, expanded/compact title states, and non-overlap.

### Measured result

| Metric | MB4 | MB5 |
| --- | ---: | ---: |
| Draw calls | 256 | 356 |
| Triangles | 36,024 | 47,144 |
| Geometries | 130 | 193 |
| Textures | 3 | 3 |
| Programs | 11 | 12 |
| Objects | 300 | 473 |
| Meshes | 190 | 283 |
| Lights | 9 | 10 |
| Heap | ~81–86 MB | ~86–92 MB |

Repeated combat geo/texture/mesh delta: 0/0/0. Growth is intentional late-route composition and fixture geometry; repeated slabs/rubble remain instanced and shared materials remain bounded.

## Macro-batch 4

### Integration

- Visual-pass commit: `d7aa44b` (`feat(render): apply M10 cinematic presentation pass`) on top of `0d41a7f`
- Fixed unused HUD import blocking lint/typecheck
- Extracted HUD projection helpers (`resolveZoneHudCopy`, `resolveNearestThreat`, equipment labels) with focused tests
- Removed persistent `F3 — Development Details` hint; F3 still toggles `DevelopmentPanel` in DEV
- Responsive CSS: right-aligned action dock ≤1400px; collapse decorative objective/resource ≤1366px; never hide flasks
- Soft ACES readability tune (exposure 1.22, fill-heavy ambient/hemi, softer shadows) without flattening mood
- Expanded `gate:m10-hero-visual` product captures (incl. guard-break, product UI, inventory)
- Added `gate:m10-ui-compact` at 1280×720

### Performance (cinematic vs modular MB3)

| Metric | MB3 | MB4 |
| --- | --- | --- |
| Draw calls | 220 | 256 |
| Triangles | 35,059 | 36,024 |
| Geometries | 104 | 130 |
| Programs | 9 | 11 |
| Objects | 268 | 300 |
| Meshes | 159 | 190 |
| Lights | 9 | 9 |
| Heap | ~81–91 MB | ~81–86 MB |

Within M10 ceilings. Combat geo/tex/mesh Δ = 0. No feature strip for micro-regressions.

### Architecture follow-up candidates (do not auto-refactor)

- Player/enemy/Oathblade palettes → small immutable presentation presets
- Zone HUD copy already data-driven in `gameplayHudModel.ts`
- Fixture/local light ownership is placement-driven; global moon/fill remains Scene-owned
- D-005 ConnectedLevelVisual proxy co-ownership unchanged

## Verification

- `npm run verify`: lint/typecheck/351 tests/assets/build PASS
- Hero visual + compact UI + M8 stabilization + M9 combat/guard/hit-reaction/telegraph/perf + lifecycle PASS
- No tmp-m* leftovers after normal cleanup runs
- No push; no M10 tag

## Next session starts with

1. One combined M10 production-finish batch: complete Ash Walk/sealed arena, lift surface richness, refine actor materials, and establish whole-route screenshot coherence.
2. Then Product Owner visual acceptance review; do not schedule another tiny polish-only macro-batch.
3. Recommended agent: **Codex** for authored visual production.
