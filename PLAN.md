# PLAN: M14 Itemization & Loot Depth — Macro-batch 1
<!-- Live M14 graph only. -->

Input: Product Owner M14 MB1 systems brief | Stack: `STACK.md`
Task slug: `m14-itemization-loot-depth`
Agent: Cursor only

## Goal

Turn the small equipment set into a meaningful authored loot ecosystem that strengthens build identity and exploration, without a procedural ARPG loot-generator framework.

## Non-goals

- Helmet/chest/gloves/boots/rings/amulet/belt slots
- Random affixes, procedural stat rolls, legendary frameworks
- New weapon movesets / per-weapon combat runtimes
- Salvage/crafting
- Codex art/lighting/floor coverage (record handoff only)
- M15+

## Steps

- [x] 1. Equipment + modifier + definition contract (~8 authored items)
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/items/**`, `src/game/character/playerStatResolution.ts`, flask/skill cooldown composition hooks
  - verifier: focused item/modifier/stat unit tests
- [x] 2. Loot tables, duplicate→Echo policy, acquisition/equip/compare, save restore
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/items/loot*.ts`, encounters placements, `GameRuntime` pickup path, UI comparison plumbing, SaveFileV4 (no bump unless required)
  - verifier: focused inventory/equipment/save tests + comparison pure tests
- [x] 3. `gate:m14-itemization` + alpha regressions + docs/state
  - depends: 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `scripts/browser/gate-m14-*.mjs`, `package.json`, STACK/PLAN/HANDOFF/current-state/REPOMAP as needed
  - verifier: `gate:m14-itemization` + M13 skill/progression + M12 alpha + boss + lifecycle + `npm run verify`

## Locked decisions

- Slots: weapon + charm only (no third slot in MB1).
- Rarity vocabulary: Common / Bound / Reliquary (authored only; no random affixes).
- Duplicate unique item → Echo reward (no salvage).
- Prefer SaveFileV4; bump only if persistence shape cannot hold acquired IDs + equipped slots.
- Combat consumes resolved modifiers; UI must not recompute gameplay authority.
- Codex owns later icon/weapon-attachment/loot-VFX polish from exposed art hooks.

## Escalation

- Same failure 3× → stuck report + stop.
- Any need for full ARPG loot engine or new movesets → stop for review.
