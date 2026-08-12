# HANDOFF

Updated: 2026-08-12 by Codex
Task: m13-character-progression-build-identity

## Status

ACTIVE — Macro-batch 2 (progression presentation/build art/world readability) **complete locally**. M13 remains open; no tag.

## Locked decisions

- Authority: base + progression allocation + equipment → `resolvePlayerCombatStats`; combat reads resolved only.
- Attributes: Vitality (+10 HP), Resolve (+1 guard), Might (+2/+3 melee); levels 1–5; no XP loss/respec.
- SaveFileV3 persists durable facts, not derived stats.
- Active-skill foundation deferred to MB3; no fake skill UI exists.

## Delivered

- MB1: progression runtime/resolver, enemy XP, GameRuntime/save integration, base UI, `gate:m13-progression`.
- MB2: `resolvedProgressionContributions` projects authoritative resolver output; React does not calculate combat stats.
- Compact level/XP HUD, authored attribute/level/point glyphs, allocation cards, and contained level-up feedback.
- Distinct Vitality Charm/Ward Seal glyphs and focused gained/lost comparisons.
- Court presentation shell: reusable pointed/broken arch, split buttress, niche/memorial/chain vocabulary and source-visible practicals over unchanged collision.
- `gate:m13-progression-visual`: ten deterministic 1440×900/1280×720 states; artifacts clean unless `KEEP_ARTIFACTS=1`.
- Route peak: 330 draw calls, 177 geometries, 489 objects, 283 meshes, 12 lights; repeated resource growth zero.
- Toolchain: ignored `.tools/node22` had no repository references and was removed. Host used Node 24.11.0/npm 11.6.1 because canonical Node 22 was unavailable on PATH; repo law remains Node 22/npm 10.9.2.

## Verification

- Focused progression/UI/world tests, M13 gameplay/visual gates, M12 alpha, M11 boss, M10 camera/occlusion/perf, assets import/verify, lifecycle, and full `npm run verify`: PASS.
- Browser screenshots were visually inspected; normal final gate cleaned evidence and released port 4210.

## Next session starts with

1. Product Owner review: `KEEP_ARTIFACTS=1 npm run gate:m13-progression-visual`.
2. Cursor MB3: active-skill runtime foundation. Future visual hooks expected: equipped skill ID, skill state, cooldown ratio, activation semantic, skill event token.
