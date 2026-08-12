# PLAN: M10 Macro-Batch 5 — Playable Presentation Pass
<!-- Live M10 graph only. -->

Input: Product Owner MB5 playable presentation pass | Stack: `STACK.md` | Contract: `docs/art/visual-direction.md` + ADR-0002
Task slug: `m10-visual-production-identity`

## Goal

Make normal gameplay materially brighter and more authored through visible practical-light fixtures, extend the modular ossuary route through Mixed Court into the Ash Walk transition, and replace the control-first dock with an equipment/item-first HUD that keeps controls secondary.

## Non-goals

- M11; M10 closure/tag; push
- Gameplay, inventory, equipment, combat, enemy, or input redesign
- Per-fixture gameplay authority, global UI state framework, post-processing stack, third-party assets, or one-light-per-candle
- Full Ash Walk/final arena production or broad actor rebuild

## Steps

- [x] 1. Baseline and contract: capture current product frames/metrics; define fixture, placement, regional-light, and HUD projection contracts
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `PLAN.md`, render/UI contracts, focused pure tests
  - verifier: `npm run test -- src/render/world src/ui && npm run lint && npm run typecheck`
- [x] 2. Practical environment: author reusable sconces, brazier, veil lamp, candles; compose regional light pools; extend Mixed Court and Ash Walk transition
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/render/**`, modular placement/registry tests, palette/materials
  - verifier: `npm run test -- src/render/world src/physics/connectedLevelAuthoring.test.ts && npm run gate:m10-hero-visual`
- [x] 3. Product HUD: equipment/item bar, project-authored iconography, secondary key badges, contextual interaction, compact location/objective, contextual threat
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/ui/**`, `src/app/styles.css`, UI tests and gates
  - verifier: `npm run test -- src/ui && npm run gate:m10-ui-compact && npm run gate:m10-hero-visual`
- [x] 4. Product acceptance: inspect expanded screenshots, measure performance/resource stability, run gameplay/lifecycle/repository gates, update M10 durable state
  - depends: 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: browser gates, PLAN/HANDOFF/current-state/visual-direction/REPOMAP/DEBT if evidence changes
  - verifier: `npm run verify && npm run gate:m8-stabilization && npm run gate:m9-player-combat && npm run gate:m9-guard-depth && npm run gate:m9-hit-reaction && npm run gate:m9-telegraph-readability && npm run gate:m9-perf-baseline && npm run gate:lifecycle`

## Decisions

- 2026-08-12 | Visible fixture geometry explains regional lights; minor flames remain emissive-only and never become gameplay authority.
- 2026-08-12 | The permanent bottom bar projects only canonical weapon, charm, flask, and Echo state; dodge/menu hints remain compact, and interaction stays contextual.
- 2026-08-12 | Zone/objective expansion is presentation-only and collapses after a short display interval without changing simulation state.
- 2026-08-12 | Mixed Court/Ash Walk dressing follows ADR-0002 placements and retains existing collider proxies.

## Escalation

- Same failure 3× → stuck report and escalate.
- Stop if the pass requires simulation authority changes, new gameplay items, or breaking ADR-0002.
