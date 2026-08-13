# ADR-0004: Canonical dungeon compilation

- Status: Accepted
- Date: 2026-08-14

## Context

M15 MB2 authored visible room shells as world-object placements while `connectedLevelCollision` still owned a separate handwritten graybox collider map. Visible walls could exist without gameplay colliders. Product Owner rejected that split.

ADR-0003 remains the room-authoring unit. This ADR adds the compile law that render, physics, nav, lights, and interactions share one dungeon.

## Decision

Hierarchy:

**DUNGEON → ROOM → OBJECT INSTANCES → OBJECT TYPE CATALOG → render / collision / light / interaction**

1. Canonical authored dungeon content lives under `src/content/world/` and must import neither React nor Rapier.
2. `DungeonDefinition` owns rooms, connections, object instances, spawns, encounter anchors, and checkpoint anchors.
3. A reusable **type** (WallSconce, StoneWall, Gate) is one module. An **instance** is dungeon data (`wallSconce.refuge.01` at a transform). Never one source file per placed candle.
4. `compileDungeon(dungeon, catalog, dynamicState)` is a pure, deterministic compile. It does not own gameplay state. Gate colliders exist only while simulation flags say the gate is closed.
5. Production room files may not create `<mesh>`, `<pointLight>`, or `<CuboidCollider>`. Object modules and the compiler own HOW; rooms own WHAT + WHERE.
6. `CONNECTED_LEVEL_COLLIDERS` is derived from the compiler, not a second wall map.
7. No class-inheritance object framework (`BaseObject → LivingObject → …`). Prefer definitions + composition.

## Consequences

- Visual structure and collision structure cannot drift by coordinate copy-paste.
- Codex art can dress registered types without moving layout or colliders.
- Invisible gameplay volumes are forbidden unless explicitly documented.

## Links

- ADR-0002 (type catalog / no inheritance)
- ADR-0003 (room-first authoring)
- `src/content/world/dungeons/ossuary/OssuaryDungeon.ts`
- `src/content/world/compileDungeon.ts`
