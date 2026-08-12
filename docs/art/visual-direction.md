# M10 Visual Direction

**Identity:** ruined gothic ossuary under veil-light. Mourneveil uses compact heroic and predatory silhouettes against ancient funerary architecture; it does not reproduce any proprietary game design.

## Visual language

- **World:** beveled and broken abbey stone, ossuary/bone accents, dark iron, oxidized bronze, sparse worn cloth, roots, and deliberate rubble clusters.
- **Palette:** charcoal stone and near-black iron; pale ash/bone; desaturated moss and verdigris; cyan spectral veil energy; restrained amber practical light.
- **Materials:** a small shared family with rough stone, metallic funerary fittings, matte cloth/leather, bone, and emissive veil accents. Texture-free authored geometry is valid when form/material separation carries the image.
- **Lighting:** one cool veil/moon key, restrained ambient fill, and a few warm or spectral practicals. Darkness frames actors without hiding combat information.
- **Readability value structure (hero route):** background darkest → architecture dark-mid with readable edges → walkable floor clearly navigable → player strong silhouette → enemies distinct from player/background → interactable/veil highest controlled spectral accents → warm practicals as secondary foci. Do not flatten to uniform brightness; do not lose gameplay-relevant blockers into pure black.
- **Actors:** the Veilbound Warden is layered, compact, asymmetric, and cyan-accented; the skirmisher is lean, corrupted, narrow, and visibly hostile. Animation is an in-place projection of M7 semantics.
- **Feedback/UI:** arcs, shards, rings, wisps, and short pulses replace developer visualizers in normal play. A dark funerary HUD uses pale text, restrained metal/bone lines, cyan resources, and limited warm danger accents.

## Acceptance

A deterministic 1440×900 checkpoint/early-combat composition must show a production-candidate Warden, skirmisher, shrine, architecture, dressing, lighting, feedback, and HUD that read as one scene. Render meshes remain non-authoritative; accepted world and actor colliders stay explicit proxies.

M10.6 1440×900 consolidation evidence: **~294–307 draw calls across route, ~23–24k triangles, ~129–137 geometries, 3 textures, 12–13 programs, 382 objects, 228 meshes, 10 lights, ~86–92 MB reported JS heap** (down from MB5 356/47k/193/473/283). Evidence-backed guardrails are **320 draw calls, 80k triangles, 160 geometries, 16 textures, 14 programs, 420 objects, 250 meshes, 11 lights, 160 MB heap**. `gate:m10-perf-baseline` samples refuge, Mixed Court, and Ash Walk on the current production route; ceilings are regression alarms with headroom for one final Codex art pass.

## Ossuary route composition

The refuge, connecting rib corridor, and Outer Watch use one reusable shell over unchanged simple physics proxies: irregular funeral slabs and verdigris thresholds underfoot; buttress-separated wall bays with recessed bronze-crowned tomb niches; sparse sarcophagi, markers, candles, cloth, roots, and masonry at path edges; iron bars for authoritative gates. The refuge reliquary crown and rear veil-cracked watch monolith are the two orientation anchors. Warm refuge/corridor practicals yield to a cooler, wider combat focus; clutter stays off the central melee footprint.

## Playable practical-light and late-route pass

Visible funeral sconces, floor braziers, veil lamps, and candle clusters now explain light pools. Fixtures and photometric sources are separate: twelve authored fixtures share geometry/material language while only five own point lights; the full scene uses ten lights, with the cool moon key as the only shadow-casting light. Mixed Court is a broad warm processional space around a raised funeral brazier; Ash Walk begins with sparse cyan guidance, ash-dark slabs, broken arches, and a sealed-gate silhouette. All remain presentation shells over unchanged authored collider proxies.

The permanent HUD is content-first: weapon, charm, Ashen Flask, and Echo state project canonical runtime facts with project-authored glyphs. LMB/E appear as secondary badges, guard/dodge/inventory use a compact hint row, and interaction remains contextual. Zone/objective cards expand briefly on entry then collapse through presentation-only state.
