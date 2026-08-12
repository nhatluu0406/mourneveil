# HANDOFF

Updated: 2026-08-13 by Cursor
Task: m14-itemization-loot-depth

## Status

ACTIVE — Macro-batch 1 foundation complete locally. M14 not closed/tagged. System itemization + loot tables + gate green; art polish deferred to Codex.

## Locked decisions

- Slots: weapon + charm only.
- Rarity: Common / Bound / Reliquary (authored only).
- Duplicate unique → Echoes. No salvage.
- SaveFileV4 retained (inventory + equipped slots; no resolved stats).
- Combat consumes resolved modifiers; UI uses `compareItem` / `formatModifierSummary`.

## Delivered (MB1)

- 8 authored items with presentation hooks
- Typed modifiers incl. skill CD delta + flask heal
- Deterministic loot tables on skirmisher/brute/pressure/boss
- Functional inventory comparison + equip plumbing
- `gate:m14-itemization`

## Art handoff (Codex)

- Item icon/visual/equip/pickup semantics on each definition
- Floor continuity + practical-light density (PO visual concerns; not systems work)

## Known traps

- Host Node v24.11.0 / npm 11.6.2; engines declare Node 22 / npm 10 — no `.tools/node22`.
- M12 alpha HUD soak needs ≥900ms after boss loot spawn (gate hardened).

## Next session starts with

1. Optional Cursor polish: remaining content pacing / more encounter table entries if PO wants first-run coverage of all 8.
2. Or Codex large art batch once hooks stable (icons, weapon attachment, loot VFX, floor/light world pass).
