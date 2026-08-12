# HANDOFF

Updated: 2026-08-13 by Cursor
Task: m13-character-progression-build-identity

## Status

**ACCEPTED / CLOSED** — Product Owner accepted Character Progression & Build Identity.
Tagged `v0.13.0-character-progression-build` on the M13 docs-closure commit.

Floor continuity and practical-light density remain future Codex art concerns; they did not block M13 closure.

## Locked decisions

- Base + allocation + equipment resolve through `resolvePlayerCombatStats`; combat reads resolved facts only.
- SaveFileV4 persists equipped skill ID, not skill action/cooldown state.
- Skill timing, movement, contact, damage, guard effect, cooldown, and unlocks remain simulation-owned.
- Product Owner routing: Cursor owns systems/runtime; Codex owns art/assets/lighting/VFX/visual polish.

## Final verification (closure)

- Focused save/skills/progression/loot tests PASS (30)
- `gate:m13-active-skills` PASS (Veil Step / Oath Cleave / Ward Pulse, save/load, death/respawn)
- `gate:m13-progression` PASS (XP, allocate, charm composition, save/load, death preserve)
- Toolchain used: Node v24.11.0 / npm 11.6.2 (canonical Node 22 / npm 10 unavailable on PATH; no repo-local `.tools/node22`)

## Delivered

- Levels 1–5, XP, unspent points, Vitality / Resolve / Might
- Authoritative resolved combat stats composing progression + equipment
- Weapon + charm equipment; active skill loadout (Veil Step, Oath Cleave, Ward Pulse)
- SaveFileV4 + V1–V3 migration; invalid skill fallback
- Progression / loadout UI + skill presentation hooks (Codex MB4)

## Next

M14 — Itemization & Loot Depth. Do not reopen M13 execution in `PLAN.md`.
