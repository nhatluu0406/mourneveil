# HANDOFF

Updated: 2026-08-13 by Codex
Task: m13-character-progression-build-identity

## Status

ACTIVE — Macro-batch 4 complete locally. M13 remains open; no tag; no push. M13 can enter final hardening: progression, build choice, active-skill choice, save/load, combat integration, loadout UI, and presentation are complete.

## Locked authority

- Base + allocation + equipment resolve through `resolvePlayerCombatStats`; combat reads resolved facts only.
- SaveFileV4 persists equipped skill ID, not skill action/cooldown state.
- Skill timing, movement, contact, damage, guard effect, cooldown, and unlocks remain simulation-owned. UI, glyphs, pose, VFX, and world art are projection only.

## MB4 delivered

- Scrollbar root cause: the previous gate verified hidden overflow rather than fit, while the compact composition could clip its owned relic list. Oath & Armory now uses a horizontal three-skill oath row and reduced vertical redundancy.
- 1440×900: document, body, panel, and owned relic region all fit; no native scroller. 1280×720: only `[data-inventory-scroll="1"]` may use a narrow themed internal scrollbar.
- Distinct authored skill language: Veil Step fractured shards/reposition pose; Oath Cleave bronze directional streaks/committed pose; Ward Pulse body-local containment facets/braced pose. Cooldown remains a HUD icon mask over authoritative ratio.
- Warden gains profiled breastplate and hood crown; skirmisher value/material separation improved.
- Refuge/Court: dark profiled arches, dark memorial blockers, burial screens, banner, processional ember markers, brighter dark-mid floors/masonry. Existing colliders and actual-light count unchanged.
- Performance-safe shared geometries/materials; no per-activation allocation.

## Evidence

- Focused UI/render/world tests PASS; full `npm run verify`: 93 files / 420 tests PASS; build PASS (existing D-004 chunk advisory).
- Browser: M13 skill/progression/visual, M12 alpha, M11 boss, M10 camera/occlusion/perf, lifecycle PASS. Visual gate asserts actual scrollbar owners at 1440×900 and 1280×720.
- Performance: Refuge 311 calls / 148 geometries; Court 311 / 154; Ash Walk 332 / 178; 3 textures, 12–13 programs, 505 objects, 295 meshes, 12 lights, ~97 MB heap. Repeated combat delta geometry/texture/mesh/light = 0.
- Runtime host: Node 24.11.0 / npm 11.6.1; canonical Node 22/npm 10 unavailable on PATH. `.tools/node22` absent.

## Remaining M13

Final hardening only: Product Owner visual review, one full acceptance pass, documentation/closure if accepted. Do not add new progression mechanics or skills.

Recommended agent: Cursor for deterministic M13 final hardening/acceptance gates under stable contracts.
