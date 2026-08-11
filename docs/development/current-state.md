# Current State

- Updated: 2026-08-12
- Accepted release: **`v0.8.0-production-asset-pipeline`** (M8)
- Active task: `m9-combat-depth`
- Status: **M9 ACTIVE** — macro-batch 3 adds readable enemy telegraph + recovery punish window; MB1 guard impact/break and MB2 hit-reaction remain.

## What exists

- Connected-level RPG loop (zones, checkpoint, shortcut, encounters, save V2)
- Presentation foundation (HUD, occlusion fade, procedural dark-fantasy look)
- Animation presentation architecture + tuned procedural player/brute motion
- Hardened connected-level wall collision (paused Physics + explicit cuboids)
- Production asset path: source → import/verify → `/assets` → Drei, with GLB budgets and animation-semantic maps
- Guard impact / temporary guard break (transient, unsaved)
- Enemy heavy-hit interrupt into simulation-owned `hitReaction` (skirmisher threshold 1 / brute 2; attack active committed)
- Enemy attack readability: skirmisher 20/10/24 and brute 48/12/48 startup/active/recovery with phase-derived telegraph/recovery cues

## Highest-value limitations

- Brute/player/environment remain procedural placeholders except M8 slices above
- No posture/poise meter, knockback, or light-attack stuns by design in this slice
- Two melee roles; local detours are intentionally limited to simple static authored boxes; controller deferred

## Next executable work

Continue M9 from the telegraph/punish handoff; prefer a Cursor-sized player-attack readability or hit-feedback batch unless a new authority boundary is requested.
