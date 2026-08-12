# Current State

- Updated: 2026-08-12
- Accepted release: **`v0.9.0-combat-depth`** (M9)
- Active task: `m10-visual-production-identity`
- Status: **M10 ACTIVE — modular content architecture is established; a direct cinematic presentation elevation pass is implemented and awaits full installed-repo runtime verification.**

## What exists

- Connected-level RPG loop + M7/M8 animation/assets + M9 combat depth
- ADR-0002 modular world-object composition: immutable definitions, declarative placements, shared materials/geometries, explicit simulation/render authority split
- M10 hero assets: Veilbound Warden/Oathblade, veil-riven skirmisher, brute pass, ossuary refuge/corridor/Outer Watch kit
- Direct presentation pass: cinematic HUD hierarchy, ACES tone mapping, localized warm/cyan light language, unified dark floor base, actor/weapon detail accents, narrower checkpoint rune treatment, layered veil combat cues
- Debug contact volumes remain opt-in (`?debugContacts=1`)

## Highest-value limitations

- Full deterministic screenshot/runtime verification of the direct pass still needs the installed repository because the uploaded archive contains no `node_modules`/`.git`
- Mixed court, ash walk, final approach/arena, and distant perimeter remain below hero-route visual quality
- Surface richness is still largely geometry/material-color driven; future authored textures/details should be measured against existing render budgets
- Bundle advisory D-004 remains; GPU VRAM remains unavailable through current browser diagnostics

## Next executable work

Run full verify + M10 hero visual gate on the modified source, review screenshots, then continue visual production (surface richness and broader environment dressing) before adding new systems.
