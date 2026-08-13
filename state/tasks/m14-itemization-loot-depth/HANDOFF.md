# HANDOFF

Updated: 2026-08-14 by Cursor
Task: m14-itemization-loot-depth

## Status

**ACCEPTED / CLOSED** — Product Owner accepted Itemization & Loot Depth.
Tagged `v0.14.0-itemization-loot-depth` on the M14 docs-closure commit.

Camera smoothness, actor prominence, and scene-readability polish are M15 work. They did not block M14.

## Locked decisions

- Eight authored unique items; first-run discoverable set is seven plus Mourning Phial as replay alternate.
- Duplicate unique pickup converts to Echoes; loot tables stay deterministic (not procedural ARPG).
- Equipment modifiers compose through `resolvePlayerCombatStats`; combat never reads raw item switches.
- Render weapons and loot effects remain presentation only; attack reach/contact/colliders stay simulation-owned.
- SaveFileV4 persists inventory/equipment/loot memory, not derived combat stats.

## Final verification (closure)

- `gate:m14-itemization` PASS (8 items, tradeoffs, skill composition, duplicate→Echo, boss reward, save/load)
- `gate:m14-loot-journey` PASS (7 first-run, reload no duplicate grants)
- `gate:m14-art-production` PASS (14-state art gate; 354 calls / 34,667 tris / 540 objects / 323 meshes / 12 lights at 1280×720; pickup/equip growth 0)
- Toolchain: Node v24.11.0 / npm 11.6.2 (canonical Node 22 / npm 10 unavailable on PATH; no repo-local `.tools/node22`)

## Delivered

- Authored equipment ecosystem with weapon/charm tradeoffs and item↔skill synergy
- Deterministic loot tables, pickup/equip presentation, Bound/Reliquary identity
- Ossuary floor/void language and practical-light dressing (Codex MB3)
- M14 gates: itemization, loot-journey, art-production

## Next

M15 — Presentation, Motion & Scene Readability. Do not reopen M14 execution in `PLAN.md`.
