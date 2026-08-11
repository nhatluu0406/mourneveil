# Current State

- Updated: 2026-08-12
- Accepted release: **`v0.8.0-production-asset-pipeline`** (M8)
- Active task: `m9-combat-depth`
- Status: **M9 ACTIVE** — macro-batch 1 adds deterministic guard impact and temporary guard break without adding stamina or changing contact authority.

## What exists

- Connected-level RPG loop (zones, checkpoint, shortcut, encounters, save V2)
- Presentation foundation (HUD, occlusion fade, procedural dark-fantasy look)
- Animation presentation architecture + tuned procedural player/brute motion
- Hardened connected-level wall collision (paused Physics + explicit cuboids)
- Production asset path: source → import/verify → `/assets` → Drei, with GLB budgets and animation-semantic maps
- Visible production slice: refuge shrine glTF. The skirmisher GLB remains an isolated technical proof; playable skirmishers use the Product Owner-preferred procedural presentation.
- The procedural player blade is a compact 0.56 m placeholder; visual length remains independent of attack/contact authority.
- Enemies use deterministic short-lived footprint detours around reachable static blockers, with Rapier retaining collision authority.
- Active M8 browser gates own and clean up their Vite and Playwright processes on pass/failure; already-exited POSIX groups are idempotent teardown rather than CI failures.

## Highest-value limitations

- Brute/player/environment remain procedural placeholders except M8 slices above
- Skirmisher proof mesh is intentionally minimal and rejected as default playable art
- Two melee roles; local detours are intentionally limited to simple static authored boxes; controller deferred

## Next executable work

Continue M9 from the guard-depth handoff; choose the next narrow mechanic from measured combat gaps rather than expanding into M10.
