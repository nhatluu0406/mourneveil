# PLAN: M4 Core RPG Loop
<!-- Live execution graph for M4 only. M3 Enemy Framework is Product Owner accepted. -->

Input: M3 accepted by Product Owner on 2026-08-09 | Stack: `STACK.md` | Contracts: `docs/product/vertical-slice.md`, `docs/architecture/overview.md`
Task slug: `m4-core-rpg-loop` (`python3 scripts/leanloop/task.py start m4-core-rpg-loop`)

## Scope

- Promote the single M3 player-health proof into canonical gameplay health and death authority.
- Add one graybox checkpoint, deterministic respawn/reset boundary, and one limited healing flask.
- Preserve M2 combat, M3 enemy/encounter, simulation authority, and typed semantic input.

## Non-goals

- Multiple checkpoints, checkpoint menus, player progression, production HUD, production assets, or controller work
- Inventory, currency, equipment, loot, save data, or persistence during M4.1-M4.3
- Armor, resistances, status effects, stamina, flask upgrades, or regeneration
- React remount/browser reload as gameplay reset authority
- M4.4-M4.6 implementation during the current batch

## Steps
<!-- risk: LOW|MEDIUM|HIGH ; isolation: inline|sequential|worktree -->

- [x] 1. M4.1 — Canonical player health and death
  - depends: M3 Product Owner acceptance
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: canonical player health/death runtime, movement/combat eligibility, minimal diagnostic/HUD projection, focused tests
  - outcome: one authoritative health contract owns max/current health, deterministic damage/restore, alive/dead; death disables player movement and new combat/defense actions while simulation/render remain alive
  - non-goals: respawn, healing, checkpoint, production death UI
  - verifier: focused player health/runtime + enemy lifecycle tests, `npm run lint`, `npm run typecheck`, `git diff --check`
  - evidence: canonical `PlayerHealthRuntime` replaces the M3 development naming; stable health/hurtbox identity, clamped damage, explicit alive/dead state, restore boundary, and death-owned combat/defense/motor stop; 58 focused tests plus lint/typecheck/diff check green

- [x] 2. M4.2 — Checkpoint and respawn
  - depends: 1
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: one immutable checkpoint definition, activation/current reference, semantic interaction/retry input, authoritative respawn, deterministic encounter recreation
  - outcome: death → retry restores player transform/health, clears stale player action/input state, and recreates the graybox encounter without browser reload or React remount authority
  - non-goals: multiple checkpoints, persistence, bonfire menu, quest/interact framework
  - verifier: focused checkpoint/respawn/encounter reset tests, M4.1 regressions, `npm run lint`, `npm run typecheck`, HUMAN-VERIFY repeated browser death/respawn when browser control is available
  - evidence: one `checkpoint.graybox.entry` activates through semantic F interaction; dead-only semantic R respawn restores authored transform/full health, clears player action/defense/contact state, and resets both enemy runtimes/contact dedup at their authored spawns; 34 focused tests plus lint/typecheck/diff check green; Vite HTTP 200 but in-app browser list empty, so manual cycle unverified

- [x] 3. M4.3 — Healing flask
  - depends: 2
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: centralized flask definition/runtime, semantic E use request, short fixed-step committed use action, checkpoint refill
  - outcome: eligible living damaged player consumes one charge and heals deterministically; checkpoint activation/rest refills; death/full health/no charge/committed-action use is rejected
  - non-goals: inventory integration, upgrades, animation assets, status effects
  - verifier: focused flask/input/checkpoint tests, M4.1-M4.2 regressions, then full repository verification gate
  - evidence: E emits one semantic use edge; centralized 3-charge/40-health flask uses a 12/1/18-step committed action, consumes/heals once on its active step, clamps through canonical health, and rejects dead/full/no-charge/guard/committed-action use; checkpoint interaction/rest and respawn refill; 47 focused tests green; final 159/159 suite, lint, typecheck, build, verify, diff check, doctor strict, and sync check green

- [ ] 4. M4.4 — Loot pickup proof
  - depends: 3
  - risk: MEDIUM
  - isolation: sequential
  - outcome: one deterministic enemy reward and pickup path using authored item identity
  - non-goals: random tables, currency economy, inventory UI, implementation in the current batch

- [ ] 5. M4.5 — Equipment proof
  - depends: 4
  - risk: HIGH
  - isolation: sequential
  - outcome: one minimal equipment choice affects an explicit gameplay contract without a generalized stat framework
  - non-goals: crafting, rarity, equipment grid, implementation in the current batch

- [ ] 6. M4.6 — Versioned local save and M4 verification
  - depends: 5
  - risk: HIGH
  - isolation: sequential
  - outcome: versioned local persistence for accepted M4 state plus complete recovery-loop verification and Product Owner gate
  - non-goals: cloud/backend saves, migration framework beyond the first schema, implementation in the current batch

## Parallel groups

- none — M4 gameplay authority steps are sequential

## Decisions
<!-- append-only: date | decision | reason -->

- 2026-08-09 | M3 Enemy Framework Product Owner accepted; initialize M4 Core RPG Loop | Product Owner explicitly authorized M4.1-M4.3
- 2026-08-09 | Promote the existing M3 player combat health instance rather than create a parallel health system | Preserves proven incoming-damage and combat target authority
- 2026-08-09 | M4.1-M4.3 use one checkpoint, deterministic encounter recreation, and a centralized limited flask | Smallest complete death/recovery loop before loot, equipment, and persistence
- 2026-08-09 | Respawn counts as checkpoint rest and refills the canonical flask; the mixed encounter is reset while the independent training target is preserved | Makes repeated recovery deterministic without browser reload or broad world reset

## Escalation

- Any failed internal gate or HIGH-risk authority conflict stops the batch before the next step.
- Same error 3 times: stop, write a stuck report under the active task `reports/`, and escalate.

## Next milestone pointer

- After this batch: M4.4, then M4.5, then M4.6. Do not start M4.4 in this session.
