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
