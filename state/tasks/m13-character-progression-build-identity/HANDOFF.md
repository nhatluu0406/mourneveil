# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m13-character-progression-build-identity

## Status

ACTIVE — Macro-batch 1 (progression foundation) **complete locally**. Awaiting Product Owner review before M13 close/tag.

## Locked decisions

- M13 = Character Progression & Build Identity.
- Authority: base + progression allocation + equipment → `resolvePlayerCombatStats`; combat reads resolved only.
- Attributes: Vitality (+10 HP), Resolve (+1 guard), Might (+2/+3 melee).
- Levels 1–5; one unspent point per level; no XP loss on death; no respec.
- SaveFileV3 + V1/V2 migration; derived stats not persisted.
- Active skill foundation **deferred to MB2**.

## Delivered (MB1)

- Progression runtime + resolver + enemy `xpReward`
- GameRuntime grant/allocate/compose + death durability
- Inventory Build spend UI + HUD progression toast
- `npm run gate:m13-progression`

## Next session starts with

1. Product Owner play of progression journey, then recommend MB2: active skill runtime (Cursor) before UI polish (Codex).
