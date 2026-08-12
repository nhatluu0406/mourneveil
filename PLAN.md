# PLAN: M12 Vertical Slice Alpha Acceptance — Macro-batch 2
<!-- Live M12 graph only. -->

Input: MB1 at `2826701`; M11 tag on `19abed3` | Stack: `STACK.md`
Task slug: `m12-vertical-slice-alpha-acceptance`
Agent: Cursor only

## Goal

Audit the complete vertical slice against `docs/product/vertical-slice.md`, close at most three genuine alpha blockers, and add `gate:m12-alpha-slice`. No M13 systems.

## Non-goals

- M12 tag/self-close; M13 Playable Alpha depth
- Skill trees, XP, NPC/dialogue, crafting, rarity economy, quest engine
- Broad art/camera redesign; triangle chasing

## Steps

- [x] 1. Acceptance criteria + playthrough audit + M11 tag correction
  - depends: —
  - risk: LOW
  - isolation: sequential
  - owns/allows: PLAN/HANDOFF notes; local tag retarget only
  - verifier: `git show v0.11.0-boss-vertical-slice --no-patch`
- [x] 2. Close ≤3 alpha blockers (endpoint, loot feedback, build clarity)
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: HUD/inventory projection, thin acquisition signal; no combat redesign
  - verifier: `npx vitest run src/ui src/game/character/verticalSliceAcceptance.test.ts`
- [x] 3. End-to-end `gate:m12-alpha-slice` + regression + docs
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `scripts/browser/gate-m12-alpha-slice.mjs`, package script, HANDOFF/current-state
  - verifier: `npm run gate:m12-alpha-slice && npm run gate:m12-build-choice && npm run verify`

## Decisions

- Vertical-slice contract (`docs/product/vertical-slice.md`) is the M12 acceptance source of truth.
- M11 tag convention is closure-docs commit (M7–M10); local tag retargeted to `19abed3`.
- Blockers closed: (1) post-boss rite-complete endpoint, (2) acquisition toast + I-to-equip cue, (3) inventory Guard/build comparison.
- Elite variation / controller / deep itemization remain out of M12 scope.

## Escalation

- Same failure 3× → stuck report.
- New gameplay-authority redesign → stop for review.
