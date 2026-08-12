# PLAN: M13 Character Progression & Build Identity — Macro-batch 1
<!-- Live M13 graph only. -->

Input: PO close-M12 + start-M13 brief | Stack: `STACK.md`
Task slug: `m13-character-progression-build-identity`
Agent: Cursor only

## Goal

Add the smallest durable progression layer (XP/level 1–5, Vitality/Resolve/Might points, authoritative stat resolution composing with equipment, save persistence, minimal UI/feedback, `gate:m13-progression`) without destabilizing combat authority.

## Non-goals

- M14 / world expansion / NPC / dialogue / quests / crafting / rarity / respec / vendors
- Large skill tree, mana system, crit/penetration, dynamic enemy level scaling
- Souls-like XP loss on death
- Codex polish (skill VFX/icons/UI art) — defer; active skill foundation only if core stays small

## Steps

- [x] 1. Stat contract + resolver + XP/level/allocation pure runtimes + tests
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/character/playerProgression*`, `playerStatResolution*`; enemy `xpReward`; STACK progression law
  - verifier: `npx vitest run src/game/character/playerProgression.test.ts src/game/character/playerProgression.integration.test.ts`
- [x] 2. Wire GameRuntime + SaveFileV3 migration + death durability + HUD/inventory projection
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `GameRuntime*`, `save/*`, `browserGate`, `ui/*`, item equipment composition tests
  - verifier: `npx vitest run src/game/save src/game/character src/game/runtime/GameRuntime.test.ts src/ui`
- [x] 3. `gate:m13-progression` + regression + docs/HANDOFF
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `scripts/browser/gate-m13-progression.mjs`, package script, PLAN/HANDOFF/current-state/DEBT
  - verifier: `npm run gate:m13-progression && npm run gate:m12-alpha-slice && npm run verify`

## Decisions

- Canonical M13 name: Character Progression & Build Identity (roadmap Playable Alpha train).
- Initial attributes: Vitality / Resolve / Might; levels 1–5; one point per level-up; no respec.
- Active skill foundation deferred to MB2 (progression + Save V3 + gate already filled MB1).
- Persist only durable progression facts; recompute resolved combat stats.
- XP rewards mirror echo authorship (25 / 60 / 200); cumulative XP thresholds 0 / 50 / 120 / 220 / 350.
- Effects: Vitality +10 max HP; Resolve +1 guard threshold; Might +2 light / +3 heavy.

## Escalation

- Same failure 3× → stuck report.
- Combat authority redesign → stop for review.
