# PLAN: M11 Boss Vertical Slice — Macro-batch 2 (Visual Production)
<!-- Live M11 graph only. -->

Input: M11 MB1 gameplay foundation at `67a3d43` | Stack: `STACK.md`
Task slug: `m11-boss-vertical-slice`

## Goal

Produce one screenshot-worthy Veilbound Sepulchre encounter: unique project-authored boss, readable authored arena, boss-specific presentation, and a calmer combat HUD. Gameplay authority remains unchanged.

## Non-goals

- M11 closure/tag; M12; boss gameplay, phase, attack, contact, damage, save, or camera redesign
- Third-party assets; generalized particles, animation graphs, lighting managers, or UI frameworks
- Broad route/actor polish outside the final arena

## Steps

- [x] 1. Boss visual contract and modular production candidate
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/render/boss/**`, boss branch in `EnemyVisual`, production visual ledger, focused pure presentation tests
  - verifier: `npx vitest run src/render/boss src/content/assets/productionVisualLedger.test.ts`
- [x] 2. Funeral prop family and Veilbound Sepulchre arena
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: ADR-0002 object types/registry/geometries/materials/placements, arena-only unique render modules
  - verifier: `npx vitest run src/render/world src/render/ossuaryEnvironmentLayout.test.ts`
- [x] 3. Boss VFX and combat-HUD hierarchy
  - depends: 1, 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: boss presentation/VFX projection, `GameplayHud`, HUD model/styles; authoritative snapshot reads only
  - verifier: `npx vitest run src/render src/ui`
- [x] 4. Deterministic visual acceptance and full regression gate
  - depends: 1, 2, 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `gate:m11-boss-visual`, package script, M11 docs/state/REPOMAP
  - verifier: `npm run gate:m11-boss-foundation && npm run gate:m11-boss-visual && npm run gate:m10-perf-baseline && npm run verify`

## Decisions

- Display identity remains **The Veilbound Sepulchre**, a failed funerary containment warden.
- Boss root consumes existing enemy animation/action/health snapshots; children render only.
- Phase two opens the reliquary frame and exposes a veil core; HP ratio remains sole authority.
- Arena render shell and visible light fixtures remain presentation; current zone bounds/colliders are unchanged.
- Existing M10 camera stays unchanged.

## Escalation

- Any required gameplay-authority change stops the batch for review.
- Same failure 3× → stuck report and escalate.
