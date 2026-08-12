# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m10-visual-production-identity

## Status

ACTIVE — M10 macro-batch 3 modular content architecture + readability recovery PASS; M10 remains open and untagged.

## Locked decisions

- Identity remains “ruined gothic ossuary under veil-light”; ADR-0002 locks data-driven modular world objects (not class-inheritance OOP).
- `connectedLevelCollision.ts` remains gameplay geometry authority. World-object definitions are presentation-only and may reference solids by stable ID only.
- Instancing groups placements by object definition; no generalized batching engine.
- Seven inspected 1440×900 route frames, gameplay gates, and renderer growth remain the acceptance boundary.

## Macro-batch 3

### Architecture

- Contracts: `WorldObjectDefinition` / `WorldObjectPlacement` in `src/render/world/worldObjectTypes.ts`
- Registry: immutable resolution + unknown-ID errors in `worldObjectRegistry.ts`
- Materials: shared presets in `src/render/world/ossuary/materials.ts`
- Route: declarative `OSSUARY_ROUTE_PLACEMENTS` + `WorldObjectComposer`
- `OssuaryEnvironmentKit.tsx` is a thin facade over `OssuaryEnvironmentComposition`
- Actor audit: extracted `OathbladeVisual`; full Player/Enemy body modularization deferred (not the same monolith problem)

### Maintainability proof

- Add funerary marker variant: register/reuse `ossuary.marker.*` + one placement in `routePlacements.ts`
- Move arch: edit placement transform only (`arch.corridor.0`)

### Readability

- Root cause: crushed midtones from dark albedos + aggressive fog near + high key/shadow ratio
- Fix: exposure 1.45, fill-heavy ambient/hemi, softer shadow intensity, lifted palette/zone floors, stronger shrine/corridor practicals
- Mood retained; floor slabs, bone arches, niches, Warden/Oathblade, shrine, and combat blockers readable in hero frames

### Performance (vs M10.2)

| Metric | M10.2 | After |
| --- | --- | --- |
| Draw calls | 220 | 220 |
| Triangles | 35,059 | 35,059 |
| Geometries | 102 | 104 |
| Textures | 3 | 3 |
| Programs | 9 | 9 |
| Objects | 266 | 268 |
| Meshes | 159 | 159 |
| Lights | 9 | 9 |
| Heap | ~91.7 MB | ~81–91 MB |

Instancing preserved. Combat geo/tex/mesh Δ = 0.

## Verification

- Focused world/registry/route tests PASS; full suite 81 files / 348 tests PASS
- `npm run verify` PASS; hero visual PASS; M9 combat/guard/hit-reaction/telegraph/perf PASS; lifecycle PASS
- M8 stabilization gameplay assertions PASS; `portReusable` false while user `npm run dev` holds :4173 (not a content regression)
- Assets verify PASS; doctor/sync after commit; no M10 tag; no push

## Debt and limits

- D-002–D-004 unchanged
- D-005 added: ConnectedLevelVisual still co-owns collider proxy presentation with zone floors (revisit on mixed-court production)
- Distant perimeter / mixed court / ash walk / final arena still below hero-route standard — active M10 scope, not OOP debt

## Next session starts with

1. Expand mixed-court/final-approach environment using the modular placement contract
2. Optional: further actor body module split only if screenshot blast radius demands it

## Direct Product-Owner Visual Elevation Pass — 2026-08-12

A direct source pass was performed from the uploaded project archive after comparing the current M10 frame with the supplied dark-fantasy ARPG reference.

### Verified architecture conclusion

- ADR-0002 is the correct direction: immutable reusable definitions + declarative placements + presentation/runtime authority split.
- A class-inheritance OOP rewrite is **not** recommended. The current maintainability problem was already addressed by the modular world-object contract; remaining quality gap is primarily art direction, screen hierarchy, and authored detail.

### Source changes

- Full-screen HUD hierarchy: location card, nearest-threat health bar, zone objective, Oathward status card, Echo resource plaque, prompt/feedback layer, and six-cell command dock.
- Original Mourneveil presentation only; no proprietary reference assets or exact UI copies.
- ACES filmic tone mapping, soft shadows, DPR cap 1.35, darker neutral palette, lower global fill and stronger local warm/cyan practical pools.
- Unified zone base-floor presentation to remove large colored rectangular region blocks.
- Oathblade detail/inlay/guard/pommel pass; additional Warden, Skirmisher, and Brute silhouette/material accents.
- Checkpoint ground cue reduced from a large bright disc to narrower runic rings/spokes.
- Combat veil VFX changed toward layered arcs/shards instead of generic single-ring geometry.
- Inventory overlay/panel received a matching funerary presentation pass.

### Verification available in uploaded archive

- Parsed all 196 non-declaration TypeScript/TSX files through the TypeScript transpiler: no syntactic diagnostics.
- Parsed `src/app/styles.css` with PostCSS: PASS.
- A static compositional mock was generated from the supplied current screenshot to validate the intended HUD/value hierarchy before source changes were finalized.

### Verification unavailable here

The uploaded archive intentionally/incidentally contains no `.git` directory and no `node_modules`. Network package installation is unavailable in this sandbox, so `npm run verify`, Playwright gates, renderer metrics, and an actual rebuilt gameplay screenshot must be run when the modified files are restored to the fully installed repository.

### Next session starts with

1. Copy/apply this direct pass into the real working tree if the uploaded archive is not itself the working copy.
2. `npm run verify` plus `KEEP_ARTIFACTS=1 npm run gate:m10-hero-visual`.
3. Product Owner reviews refuge/combat screenshots.
4. Only after that, resume Cursor/Codex; prioritize surface richness, wider-zone dressing, and authored VFX/asset detail over new gameplay mechanics.
