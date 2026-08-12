# M10 Visual Direction

**Identity:** ruined gothic ossuary under veil-light. Mourneveil uses compact heroic and predatory silhouettes against ancient funerary architecture; it does not reproduce any proprietary game design.

## Visual language

- **World:** beveled and broken abbey stone, ossuary/bone accents, dark iron, oxidized bronze, sparse worn cloth, roots, and deliberate rubble clusters.
- **Palette:** charcoal stone and near-black iron; pale ash/bone; desaturated moss and verdigris; cyan spectral veil energy; restrained amber practical light.
- **Materials:** a small shared family with rough stone, metallic funerary fittings, matte cloth/leather, bone, and emissive veil accents. Texture-free authored geometry is valid when form/material separation carries the image.
- **Lighting:** one cool veil/moon key, restrained ambient fill, and a few warm or spectral practicals. Darkness frames actors without hiding combat information.
- **Actors:** the Veilbound Warden is layered, compact, asymmetric, and cyan-accented; the skirmisher is lean, corrupted, narrow, and visibly hostile. Animation is an in-place projection of M7 semantics.
- **Feedback/UI:** arcs, shards, rings, wisps, and short pulses replace developer visualizers in normal play. A dark funerary HUD uses pale text, restrained metal/bone lines, cyan resources, and limited warm danger accents.

## Acceptance

A deterministic 1440×900 checkpoint/early-combat composition must show a production-candidate Warden, skirmisher, shrine, architecture, dressing, lighting, feedback, and HUD that read as one scene. Render meshes remain non-authoritative; accepted world and actor colliders stay explicit proxies.

Initial 1440×900 hero-scene ceilings, measured after the first integrated pass: **280 draw calls, 75k triangles, 150 geometries, 16 textures, 12 programs, 400 objects, 240 meshes, 9 lights, 160 MB reported JS heap**. These are guardrails rather than optimization targets; the gate remains DPR-capped and checks resource lifetime separately.

## Ossuary route composition

The refuge, connecting rib corridor, and Outer Watch use one reusable shell over unchanged simple physics proxies: irregular funeral slabs and verdigris thresholds underfoot; buttress-separated wall bays with recessed bronze-crowned tomb niches; sparse sarcophagi, markers, candles, cloth, roots, and masonry at path edges; iron bars for authoritative gates. The refuge reliquary crown and rear veil-cracked watch monolith are the two orientation anchors. Warm refuge/corridor practicals yield to a cooler, wider combat focus; clutter stays off the central melee footprint.
