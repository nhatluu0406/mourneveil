# HANDOFF

Updated: 2026-08-13 by Cursor
Task: m14-itemization-loot-depth

## Status

ACTIVE — M13 closed/tagged. M14 MB1 PLAN written; implementation starting (equipment definitions, modifiers, loot tables, gate).

## Art handoff (NOT M14 Cursor work)

Product Owner visual concerns for next Codex art batch:

- Floor coverage inconsistent: some regions have authored slabs; others collapse to near-black/void. Missing floors must read intentionally as walkable, broken, pit/void, or inaccessible background.
- Practical-light fixtures remain too sparse. Prefer many visible emissive fixtures without proportionally increasing real PointLights.
- Denser floor continuity, wall dressing, torch/lantern rhythm, midtone surfaces, architectural transitions.

## Locked decisions

- Follow roadmap M14 = Itemization & Loot Depth.
- Weapon + charm slots only; typed compact modifiers; authored items (~8); duplicate unique → Echoes.
- Cursor systems; Codex art later via hooks.

## Known traps

- Host Node is v24 / npm 11; canonical engines declare Node 22 / npm 10 — report, do not install `.tools/node22`.
- Floor voids + sparse practical lights are Codex art notes, not M14 blockers.

## Next session starts with

1. Continue PLAN step 1 if incomplete; otherwise run `gate:m14-itemization` and regressions.
