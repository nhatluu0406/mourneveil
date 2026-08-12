# PLAN: M12 Vertical Slice Alpha Acceptance — Macro-batch 1
<!-- Live M12 graph only. -->

Input: M11 closed at hardening `f84c619` + closure docs | Stack: `STACK.md`
Task slug: `m12-vertical-slice-alpha-acceptance`
Agent: Cursor only

## Goal

Close a Vertical Slice Alpha acceptance gap: charm choice must create a real survivability vs guard tradeoff through the existing equipment→modifier→combat authority path. No M13 deep itemization.

## Non-goals

- M12 tag/closure; M13 Playable Alpha deep progression
- Skill trees, crafting, randomized affixes, large RPG stat frameworks
- HUD redesign; item art / loot VFX polish (Codex later)
- Boss/enemy global rebalance; new Three.js content

## Steps

- [ ] 1. Equipment modifier contract + ward charm definition
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/game/items/**`, defense threshold wiring in `playerDefense` / `GameRuntime`
  - verifier: `npx vitest run src/game/items src/game/combat/playerDefense.test.ts`
- [ ] 2. Acquisition, save/load, HUD projection, tradeoff tests
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: encounter loot placement, save tests, HUD model reads only
  - verifier: `npx vitest run src/game/character/playerLootEquipment.integration.test.ts src/game/save src/ui`
- [ ] 3. M12 runtime gate + regression + docs
  - depends: 1, 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `scripts/browser/gate-m12-*.mjs`, package script, HANDOFF/CHECKPOINT
  - verifier: `npm run gate:m12-build-choice && npm run gate:m11-boss-foundation && npm run verify`

## Decisions

- Roadmap M12 name is **Vertical Slice Alpha acceptance** (not “Progression & Build Depth”; deeper itemization remains M13+).
- MB1 closes vision’s “meaningful progression” gap with two charm tradeoffs on the existing modifier contract.
- Vitality Charm: +max HP, no guard bonus. Ward Seal: +guard impact threshold, no HP bonus.

## Escalation

- Same failure 3× → stuck report and escalate.
- Save-schema breakage without migration path → stop for review.
