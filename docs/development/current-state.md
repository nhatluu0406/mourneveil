# Current State

- Updated: 2026-08-12
- Accepted release: **`v0.7.0-animation-foundation`** (M7)
- Active task: `m8-production-asset-pipeline`
- Status: **M8 ACTIVE** — macro-batch 3 stabilization complete; asset expansion remains paused pending the next M8 plan. M8 not tagged.

## What exists

- Connected-level RPG loop (zones, checkpoint, shortcut, encounters, save V2)
- Presentation foundation (HUD, occlusion fade, procedural dark-fantasy look)
- Animation presentation architecture + tuned procedural player/brute motion
- Hardened connected-level wall collision (paused Physics + explicit cuboids)
- Production asset path: source → import/verify → `/assets` → Drei, with GLB budgets and animation-semantic maps
- Visible production slice: refuge shrine glTF. The skirmisher GLB remains an isolated technical proof; playable skirmishers use the Product Owner-preferred procedural presentation.
- Held player weapons retract visually against authored solid walls without changing attack/contact authority.
- Active M8 browser gates own and clean up their Vite and Playwright processes on pass/failure.

## Highest-value limitations

- Brute/player/environment remain procedural placeholders except M8 slices above
- Skirmisher proof mesh is intentionally minimal and rejected as default playable art
- Two melee roles; authored navigation; controller deferred

## Next executable work

Product Owner review of the stabilization screenshots/runtime, then plan the next narrowly scoped M8 asset candidate; do not start M9.
