# PLAN: M11 Boss Vertical Slice — Macro-batch 1 (Gameplay Foundation)
<!-- Live M11 graph only. -->

Input: M10 closed; roadmap M11 Boss Vertical Slice | Stack: `STACK.md`
Task slug: `m11-boss-vertical-slice`

## Goal

Ship one complete technical boss encounter vertical slice that reuses existing combat/AI/world/save/UI foundations. Temporary presentation only — Codex owns boss/arena art later.

## Non-goals

- M12; M11 tag/completion; polished boss art/arena/VFX/UI redesign
- Behavior-tree / boss scripting language / lock-on camera / posture system
- Full reward/progression systems; ECS/manager frameworks

## Steps

- [ ] 1. M10 hygiene close + tag `v0.10.0-visual-production-identity`
  - depends: —
  - risk: MED
  - isolation: sequential
  - owns/allows: tmp cleanup, docs, debt, PLAN transition, tag
  - verifier: `npm run verify && npm run gate:lifecycle && git tag -l v0.10.0-visual-production-identity`
- [ ] 2. Boss contract + role/kit/phase/AI policy (pure modules + tests)
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/enemies/boss*`, enemyRoles/hitReaction extensions
  - verifier: `npx vitest run src/game/enemies`
- [ ] 3. Arena encounter wiring + save defeated flag + UI threat titles
  - depends: 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: encounters, connectedLevel, save, GameRuntime, GameplayHud model
  - verifier: `npx vitest run src/game/encounters src/game/save src/ui`
- [ ] 4. Temporary boss presentation + technical runtime gate + Codex handoff
  - depends: 3
  - risk: MED
  - isolation: sequential
  - owns/allows: EnemyVisual boss branch, `gate:m11-boss-foundation`, docs handoff
  - verifier: `npm run gate:m11-boss-foundation && npm run verify`

## Decisions

- Technical ID: `boss.veilbound-sepulchre` / runtime `enemy.boss.sepulchre.1`
- Two phases max; 3–4 attacks; reuse FollowCameraRig and enemy contact authority
- Codex later owns visual/arena/VFX/UI polish

## Escalation

- Same failure 3× → stuck report and escalate.
