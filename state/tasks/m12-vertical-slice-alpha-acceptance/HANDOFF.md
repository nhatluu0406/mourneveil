# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m12-vertical-slice-alpha-acceptance

## Status

ACTIVE — Macro-batch 1 complete locally. M12 not closed / not tagged.

## Locked decisions

- Canonical M12 = **Vertical Slice Alpha acceptance** (roadmap). Deeper itemization remains Playable Alpha (M13+).
- Charm tradeoff: Vitality (+20 HP) vs Ward Seal (+1 guard threshold). Neither dominates both axes.
- Modifiers stay definition-driven; GameRuntime syncs health max + defense threshold.

## Delivered (MB1)

- `guardImpactThresholdBonus` on item modifiers
- `item.charm.ward-seal` + pressure-encounter loot source
- Authoritative defense threshold sync; HUD projects `HP · Guard`
- Tests: tradeoff, save/load, unknown id, threshold break
- Gate: `npm run gate:m12-build-choice`

## Next

M12 Macro-batch 2 — remaining alpha acceptance gaps (PO scope). Item art/icons/loot VFX → Codex. Further build plumbing → Cursor.

## Non-goals still hold

M12 tag without PO; M13 deep progression; crafting/affixes/skill trees; HUD redesign.
