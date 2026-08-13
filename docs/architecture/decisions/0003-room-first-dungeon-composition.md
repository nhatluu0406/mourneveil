# ADR-0003: Room-first dungeon composition

- Status: Accepted
- Date: 2026-08-14

## Context

M14/M15 MB1 assembled the hero route from many independent ADR-0002 placements. Product Owner rejected that as a room model: density stood in for structure, camera-near architecture faded to 5% opacity, and ordinary props could read as floating. Occlusion-by-invisibility is not acceptable.

## Decision

Author **rooms first**, then derive placements:

1. **Gameplay authority** stays in `connectedLevel` / collision / encounters / checkpoint / gates. Room composition does not decide damage, loot, or save outcomes.
2. **`DungeonRoomDefinition`** owns rectangular floor footprints, wall sides, openings, camera-near policy, one landmark anchor, practical-light anchors, and dressing zones.
3. **Structural shell** is generated: foundation → bounds → walls → openings. Camera-near sides (east/+X, north/+Z for the current oblique follow camera) use low parapets. Far sides may be tall. No roof in this slice.
4. **Visual placements** (ADR-0002) instantiate the shell, then sparse dressing. Dressing may not fill the combat center.
5. **Light anchors belong to rooms.** Every important pool has a visible fixture. Sparse `actual-light` variants still own the PointLight budget.
6. **Grounding law:** every ordinary placement is `floor`, `wall`, `hanging` (with support), or `structural`. Only explicit `vfx` may float.
7. **Occlusion law:** static architecture remains opaque. Only simulation-driven gate bars (`gate.shortcut`, `gate.final`) may fade.

Hierarchy: **ROOM COMPOSITION → OBJECT INSTANCES → TYPE CATALOG → compile → render/collision/light/interaction** (ADR-0004).

## Consequences

### Positive

- Rooms remain readable without magical transparency.
- Placement edits cannot silently invent a new dungeon topology.
- Codex art later dresses stable shells without moving layout.

### Negative

- Shared walls need a single owner (camera-near low wins over far tall).
- L-shaped spaces use multiple floor rectangles under one room.

## Links

- `docs/design/m15-dungeon-floorplan.md`
- `src/content/world/dungeons/ossuary/`
- ADR-0002 (registry remains the object substrate)
- ADR-0004 (compile law)
