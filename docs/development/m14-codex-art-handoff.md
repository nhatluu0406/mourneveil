# M14 → Codex Art Handoff

Updated: 2026-08-13 by Cursor
Status: M14 systems/content ready for one large Codex art production pass.
Do not change gameplay authority, loot tables, modifiers, or save schema in the art batch.

## Item art hooks (stable)

| Item ID | Display | Slot | Rarity | Icon key | Visual key | Pickup semantic | Equip semantic |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `item.weapon.oathblade` | Oathblade | weapon | bound | `icon.weapon.oathblade` | `visual.weapon.oathblade` | `pickup.weapon.bound` | `equip.weapon.bound` |
| `item.weapon.gravebrand` | Gravebrand | weapon | bound | `icon.weapon.gravebrand` | `visual.weapon.gravebrand` | `pickup.weapon.bound` | `equip.weapon.bound` |
| `item.weapon.veil-thorn` | Veil Thorn | weapon | bound | `icon.weapon.veil-thorn` | `visual.weapon.veil-thorn` | `pickup.weapon.bound` | `equip.weapon.bound` |
| `item.charm.vitality` | Vitality Charm | charm | bound | `icon.charm.vitality` | `visual.charm.vitality` | `pickup.charm.bound` | `equip.charm.bound` |
| `item.charm.ward-seal` | Ward Seal | charm | bound | `icon.charm.ward-seal` | `visual.charm.ward-seal` | `pickup.charm.bound` | `equip.charm.bound` |
| `item.charm.oathbrand-ember` | Oathbrand Ember | charm | bound | `icon.charm.oathbrand-ember` | `visual.charm.oathbrand-ember` | `pickup.charm.bound` | `equip.charm.bound` |
| `item.charm.ash-circlet` | Ash Circlet | charm | reliquary | `icon.charm.ash-circlet` | `visual.charm.ash-circlet` | `pickup.charm.reliquary` | `equip.charm.reliquary` |
| `item.charm.mourning-phial` | Mourning Phial | charm | reliquary | `icon.charm.mourning-phial` | `visual.charm.mourning-phial` | `pickup.charm.reliquary` | `equip.charm.reliquary` |

### Codex item deliverables (one batch)

- Distinct inventory/HUD icons for each of the 8 items (rarity-readable Bound vs Reliquary)
- Weapon attachment/visual variants for Oathblade / Gravebrand / Veil Thorn (presentation only)
- Charm/relic icon treatment for the five charms
- Pickup VFX keyed by `pickup.*` semantics
- Equip affirmation VFX keyed by `equip.*` semantics
- Optional acquisition toast chrome polish (systems already emit name/slot/rarity/tradeoff text)

## World art issues (Product Owner)

### Floor / void language

Every visible gameplay region must read as exactly one of:

1. walkable authored floor
2. broken/collapsed floor
3. intentional pit/void
4. inaccessible architecture

No ambiguous featureless near-black space. Authored slabs already exist in some route regions; other architectural areas still collapse into void — close those gaps intentionally.

### Practical light density

Visible fixture density may increase substantially **without** proportionally increasing real PointLights.

Prefer many:

- sconces
- candles
- reliquary lamps
- ember bowls
- processional torches

Prefer few:

- real regional lights

Lighting should create route rhythm (Refuge → Court → Ash Walk → Sepulchre).

### Additional world notes

- Dark architectural voids and giant primitive wall masses need midtone hierarchy and dressing
- Keep collider/light-count budgets unless an accepted performance gate authorizes change

## Out of scope for Codex art batch

- Loot table changes, modifier math, save migrations
- New equipment slots or ninth item
- Combat timing / skill authority
- Random affix systems
