# Current State

- Updated: 2026-08-12
- Accepted release: **`v0.7.0-animation-foundation`** (M7)
- Active task: `m8-production-asset-pipeline`
- Status: **M8 READY FOR PRODUCT OWNER ACCEPTANCE** — the lifecycle CI regression is fixed and CI-equivalent verification is green. M8 remains unaccepted/untagged until Product Owner closure.

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

Product Owner acceptance/closure of M8. If accepted, prepare M9 Combat Depth separately; do not add an M9 execution graph or implementation before closure.
