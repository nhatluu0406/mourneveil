# PLAN: M14 Itemization & Loot Depth — Macro-batch 3
<!-- Live M14 graph only. -->

Input: Product Owner M14 MB3 art-production brief | Stack: `STACK.md`
Task slug: `m14-itemization-loot-depth`
Agent: Codex only

## Goal

Deliver one obvious art-only uplift across item identity, equipped weapons, loot feedback, connected floor/void language, practical-light rhythm, and ossuary architecture while preserving all M14 gameplay authority.

## Non-goals

- Item modifiers, loot order/tables, duplicate rules, equipment rules, skills, combat, save, progression, boss or encounter authority
- Ninth item, procedural loot, new gameplay regions, global exposure solution
- M14 closure/tag, M15, push

## Steps

- [x] 1. Item and equipment identity
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: item glyph projection, player weapon presentation, pickup/equip presentation, acquisition toast styling, focused tests
  - verifier: focused item/weapon/presentation tests + M14 itemization gate
- [x] 2. Connected ossuary floor, void, illumination, and architecture pass
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: ADR-0002 definitions/placements/geometries/materials/lights, visual-only route composition, focused tests
  - verifier: route placement tests + camera/occlusion/performance gates + screenshot review
- [x] 3. Art evidence, full regressions, and durable handoff
  - depends: 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: M14 art gate, package script, visual direction, active HANDOFF/current-state/REPOMAP
  - verifier: M14/M13/M12 gates + assets/lifecycle + `npm run verify` + LeanLoop checks

## Locked decisions

- All eight item IDs and all gameplay/save/runtime contracts are immutable for this batch.
- Equipped weapon visual derives from the existing equipped item snapshot; render geometry never changes reach/contact.
- World additions are presentation shells over unchanged physics/world authority.
- Visible fixtures may multiply through shared/instanced assets; actual light count stays bounded and evidence-driven.
- M14 remains active; Cursor owns final hardening, systems fixes, acceptance, and closure.

## Escalation

- Any required gameplay/save/loot authority change → stop and report to Cursor.
- Same failure 3× → stuck report + stop.
