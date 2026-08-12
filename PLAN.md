# PLAN: M14 Itemization & Loot Depth — Macro-batch 2
<!-- Live M14 graph only. -->

Input: Product Owner M14 MB2 loot ecosystem + pacing + UX brief | Stack: `STACK.md`
Task slug: `m14-itemization-loot-depth`
Agent: Cursor only

## Goal

Make the authored 8-item ecosystem discoverable and meaningful on the existing playable-alpha route: loot arc, proven weapon/charm tradeoffs, skill/flask composition, functional acquisition/compare/equip UX, save safety — without art polish or M15.

## Non-goals

- New weapon movesets, affixes, procedural rolls, rarity explosion
- Auto-equip unless already product law
- Codex art (icons, models, VFX, floors, lighting)
- Closing/tagging M14
- M15+

## Steps

- [x] 1. Authored first-run loot arc (≥6/8 discoverable) + encounter-clear grants + boss Reliquary close
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/items/loot*.ts`, encounters, GameRuntime spawn/acquire, STACK loot law
  - verifier: focused loot-table/journey unit tests
- [x] 2. Composition safety (CD floor/ceiling, flask, skill matrix, equip-during-combat rule) + compare/acquisition UX + threat priority
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: itemDefinition/comparison, combat cooldown resolver, GameRuntime equip, UI HUD/inventory, save validation
  - verifier: focused composition/flask/equip/save tests + HUD threat tests
- [x] 3. Gates + regressions + art handoff + docs/state
  - depends: 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `gate:m14-itemization`, `gate:m14-loot-journey`, package.json, HANDOFF/PLAN/current-state/REPOMAP/art handoff
  - verifier: both M14 gates + M13/M12/M11/lifecycle + `npm run verify`

## Locked decisions

- First-run exposes 7 of 8 via authored encounter + clear grants; Mourning Phial is replay/alternate.
- No Math.random loot; deterministic first-unowned / authored placement only.
- Cooldown steps clamp to floor 60 / ceiling 360 after equipment delta (base > 0).
- Equipment swap blocked while player combat action is non-idle (or dead); idle OK.
- RITE COMPLETE dominates terminal HUD; threat chrome suppressed after slice complete.
- Boss/rite first reward = Ash Circlet (Reliquary); Mourning Phial is late/alternate sustain.
- Codex owns one large subsequent art batch from `docs/development/m14-codex-art-handoff.md`.

## Escalation

- Same failure 3× → stuck report + stop.
- Need for 9th item or procedural loot → stop for review.
