# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m13-character-progression-build-identity

## Status

ACTIVE — Macro-batch 3 (active skills + loadout + progression UI hardening) **complete locally**. M13 remains open; no tag; no push.

## Locked decisions

- Authority: base + progression allocation + equipment → `resolvePlayerCombatStats`; combat reads resolved only.
- Attributes: Vitality (+10 HP), Resolve (+1 guard), Might (+2/+3 melee); levels 1–5; no XP loss/respec.
- SaveFileV4 persists durable facts + equipped skill id; unlocks derive from level; cooldown/activation never serialized.
- Active skills: one slot; Q activates; idle-only acceptance; death/respawn clears transient cooldown via combat reset.

## Delivered

- MB1: progression runtime/resolver, enemy XP, GameRuntime/save integration, base UI, `gate:m13-progression`.
- MB2: progression/build presentation, Court readability, `gate:m13-progression-visual`.
- MB3: skill contract + Veil Step / Oath Cleave / Ward Pulse; equip/loadout UI; HUD skill slot; SaveFileV4; panel scrollbar hardening; `gate:m13-active-skills`.

## Codex presentation hooks (stable)

- `snapshot.skills.equippedSkillId`
- `snapshot.skills.cooldownRatio` / `ready` / `cooldownRemainingSteps`
- `snapshot.skills.activationSemantic` / `lastActivationToken` / `executionId` / `actionPhase`
- HUD: `[data-skill-slot]`, `[data-skill-id]`, `[data-skill-ready]`
- Panel: `[data-skill-loadout]`, `[data-skill-id]`

## Verification

- Focused skill/save/UI/runtime tests + full `npm run verify`: PASS (414 tests).
- `gate:m13-active-skills`, `gate:m13-progression`, `gate:m13-progression-visual`: PASS.
- Regressions: M12 alpha (PASS on retry after HUD projection flake), M11 boss, M10 camera/occlusion, lifecycle, assets:verify: PASS.
- Host toolchain: Node 24.11.0 / npm 11.6.2 (canonical Node 22 unavailable on PATH); no `.tools/node22`; no leaked `tmp-m*`.

## Next session starts with

1. Product Owner play review of active skills + panel fit.
2. **CODEX — one large presentation batch**: authored skill icons, skill VFX, player pose/action presentation, cooldown visuals, level-up polish, progression UI final polish, world art uplift on the active route. Preserve simulation hooks above.
