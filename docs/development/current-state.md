# Current State

- Updated: 2026-08-12
- Accepted release: **`v0.7.0-animation-foundation`** (M7)
- Active task: `m8-production-asset-pipeline`
- Status: **M8 ACTIVE** — macro-batch 4 gameplay corrections complete; technical pipeline acceptance is demonstrated, pending Product Owner/content acceptance. M8 not tagged.

## What exists

- Connected-level RPG loop (zones, checkpoint, shortcut, encounters, save V2)
- Presentation foundation (HUD, occlusion fade, procedural dark-fantasy look)
- Animation presentation architecture + tuned procedural player/brute motion
- Hardened connected-level wall collision (paused Physics + explicit cuboids)
- Production asset path: source → import/verify → `/assets` → Drei, with GLB budgets and animation-semantic maps
- Visible production slice: refuge shrine glTF. The skirmisher GLB remains an isolated technical proof; playable skirmishers use the Product Owner-preferred procedural presentation.
- The procedural player blade is a compact 0.56 m placeholder; visual length remains independent of attack/contact authority.
- Enemies use deterministic short-lived footprint detours around reachable static blockers, with Rapier retaining collision authority.
- Active M8 browser gates own and clean up their Vite and Playwright processes on pass/failure.

## Highest-value limitations

- Brute/player/environment remain procedural placeholders except M8 slices above
- Skirmisher proof mesh is intentionally minimal and rejected as default playable art
- Two melee roles; local detours are intentionally limited to simple static authored boxes; controller deferred

## Next executable work

Product Owner acceptance of the compact placeholder, corrected pursuit, and existing source/import/load/animation/failure/build proof. No additional proof asset is technically required; do not start M9.
