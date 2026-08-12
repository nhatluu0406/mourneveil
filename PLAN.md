# PLAN: M13 Character Progression & Build Identity — Macro-batch 3
<!-- Live M13 graph only. -->

Input: Product Owner M13 MB3 active-skills brief | Stack: `STACK.md`
Task slug: `m13-character-progression-build-identity`
Agent: Cursor only

## Goal

Make build identity playable: one equipped active skill, three authored skills with simulation authority, loadout persistence, HUD/panel skill presentation, and Oath & Armory without a dominant native scrollbar.

## Non-goals

- Skill tree, hotbar, mana, 8-ability UI
- Animation/VFX/icon art polish (Codex later)
- M14, push, multiplayer, ECS
- Universal cancel-anything behavior
- Broad unrelated render/world refactors

## Steps

- [x] 1. Active-skill contract, three skills, unlock/equip/cooldown/save V4
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/skills/**`, combat/defense/attack hooks, `src/game/save/**`, STACK skill law, input skill binding
  - verifier: `npx vitest run src/game/skills src/game/save src/game/combat/playerDefense.test.ts src/game/character/playerProgression`
- [x] 2. GameRuntime integration + HUD/panel skill UI + scrollbar hardening
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `GameRuntime`, `browserGate`, `useGameRuntime`, `src/ui/**`, `src/app/styles.css`, animation projection hooks
  - verifier: `npx vitest run src/ui src/game/runtime/GameRuntime.test.ts src/render/animation`
- [x] 3. Gates, regression, hygiene, docs/HANDOFF
  - depends: 1, 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `scripts/browser/gate-m13-*`, package scripts, PLAN/HANDOFF/current-state/REPOMAP
  - verifier: `npm run gate:m13-active-skills` + `npm run gate:m13-progression` + visual gate + requested regressions + `npm run verify`

## Decisions

- Unlocks derived from level (L1 Veil Step, L2 Oath Cleave, L3 Ward Pulse); do not persist unlock lists.
- Persist equipped skill id only via SaveFileV4; do not persist cooldown/activation/execution.
- Death/respawn/save restore clear transient skill cooldown via existing combat reset.
- Skills activate only from combat idle + alive + not guarding/guard-broken; no universal cancel.
- Key binding: `Q` (`KeyQ`).
- Ward Pulse: clear guard impact + temporary +1 threshold for 90 steps.
- Veil Step: collision-resolved reposition, no i-frames, longer cooldown than dodge.
- Oath Cleave: fixed-step contact attack using Might via heavy-damage resolution + authored bonus.
- Panel: 1440×900 no native page/panel scrollbar; 1280×720 themed internal scroll on least-critical owned-relics section only.

## Escalation

- Same failure 3× → stuck report + stop.
- Authority conflict with combat/save → stop for review.
