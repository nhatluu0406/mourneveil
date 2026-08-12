# PLAN: M13 Character Progression & Build Identity — Macro-batch 2
<!-- Live M13 graph only. -->

Input: Product Owner M13 presentation brief | Stack: `STACK.md`
Task slug: `m13-character-progression-build-identity`
Agent: Codex only

## Goal

Make the accepted M13 progression/build facts visually legible through a compact character panel, authored attribute/item iconography, restrained HUD feedback, and a targeted Court of Quiet Names readability pass. Gameplay progression, equipment, save, and combat authority remain unchanged.

## Non-goals

- Active-skill runtime/UI, cooldowns, mana, skill tree, M14
- XP thresholds/rewards, attribute effects, charm modifiers, save schema, allocation authority
- Camera, collision, or global-lighting redesign
- Third-party art/icons, production asset download, broad world rebuild

## Steps

- [x] 1. Progression/build presentation contract and authored icon family
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/ui/*progression*`, `ItemGlyph*`, inventory/HUD model/components/tests, UI styles
  - verifier: `npx vitest run src/ui`
- [x] 2. Court readability and reusable funerary vocabulary
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/render/world/ossuary/**`, world object contracts/registry/tests, visual direction
  - verifier: focused world/render tests + `npm run gate:m10-perf-baseline`
- [x] 3. Deterministic M13 visual evidence and integration gate
  - depends: 1, 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: M13 browser gate/scripts/package entry, PLAN/HANDOFF/current-state/REPOMAP
  - verifier: `npm run gate:m13-progression` + M13 visual gate + requested regression gates + `npm run verify`

## Decisions

- UI consumes resolved snapshot values and dispatches the existing allocation request; it does not calculate combat outcomes.
- Vitality / Resolve / Might use distinct ember-crimson / bone-ward / ash-gold motifs; no fake active-skill affordance.
- World work is presentation-only through ADR-0002 objects/placements over unchanged collider proxies.
- `.tools/node22` is unreferenced ignored agent-local tooling and is removed; `.tools/` remains ignored. Verification records host toolchain truth if canonical Node 22 is unavailable.

## Escalation

- Any required gameplay/save authority change → stop for review.
- Same failure 3× → write a stuck report and stop retrying.
