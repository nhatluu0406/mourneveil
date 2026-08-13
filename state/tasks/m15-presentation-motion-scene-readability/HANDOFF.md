# HANDOFF

Updated: 2026-08-14 by Cursor
Task: m15-presentation-motion-scene-readability

## Status

ACTIVE — **M15 MB3 READY FOR PRODUCT OWNER ACCEPTANCE**. Not M15-closed. Do not tag. Do not start M16. Codex art waits for PO.

## Locked decisions (keep MB1/MB2)

- Fixed 60 Hz. Rapier on authoritative transforms. Camera follows interpolated player.
- Opaque static architecture. Fade only `gate.shortcut` / `gate.final`.
- Camera-near edges: low parapets. Far: tall. No roof.
- Distance-driven gait is presentation-only.

## Locked decisions (MB3)

- ADR-0004: DUNGEON → ROOM → INSTANCES → TYPE CATALOG → render/collision/light/interaction.
- Instance ≠ type. One module per reusable type. Dungeon owns placements.
- `compileDungeon` is the only structural authority. `CONNECTED_LEVEL_COLLIDERS` is derived.
- Title resolves Continue / New Rite / Begin Rite before `GameRuntime` construction. `?fresh=1` starts a new rite.
- I opens Armory. Oath is a separate view.

## Collision root cause (fixed)

Visual M15 walls were room-shell placements. Physics still used the legacy graybox map. Compiler now emits both from the same instances.

## Object / file notes

- Catalog modules under `src/content/world/objects/` plus `remaining.ts` for leftover types.
- `InventoryEquipmentPanel` is a shell over `oathArmory/*`.
- Actor folders re-export existing visuals (no simulation rewrite).

## Next

Product Owner play: walls, Continue vs New Rite, Armory/Oath, defeated boss corpse. Codex art only after acceptance.
