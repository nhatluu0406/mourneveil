# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m10-visual-production-identity

## Status

ACTIVE — M10 macro-batch 4 cinematic presentation integration + hardening PASS; M10 remains open and untagged.

## Locked decisions

- Identity remains “ruined gothic ossuary under veil-light”; ADR-0002 remains the world-object authoring law.
- Cinematic HUD is presentation-only; combat/resource numbers bind to `GameRuntimeSnapshot`.
- Product visual gates must not assume the pre-cinematic HUD or a persistent F3 hint.
- `connectedLevelCollision.ts` remains gameplay geometry authority.

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
- Regional lighting still Scene-authored (acceptable until multi-region lighting needs diverge)
- D-005 ConnectedLevelVisual proxy co-ownership unchanged

## Verification

- `npm run verify`: lint/typecheck/351 tests/assets/build PASS
- Hero visual + compact UI + M8 stabilization + M9 combat/guard/hit-reaction/telegraph/perf + lifecycle PASS
- No tmp-m* leftovers after normal cleanup runs
- No push; no M10 tag

## Next session starts with

1. Mixed-court environment production on ADR-0002 placements (highest product visual impact)
2. Then ash walk / final approach / distant perimeter
3. Recommended agent: **Codex** for authored environment design; **Cursor** if the batch is mostly plumbing/perf
