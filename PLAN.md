# PLAN: M4 Core RPG Loop — CLOSED
<!-- Live execution graph for M4 only. M3 Enemy Framework is Product Owner accepted. -->

Input: M3 accepted by Product Owner on 2026-08-09; M4.1–M4.6 complete; Product Owner authorized M4.7 repository-integrity closure before M5 | Stack: `STACK.md` | Contracts: `docs/product/vertical-slice.md`, `docs/architecture/overview.md`
Task slug: `m4-core-rpg-loop` (`python3 scripts/leanloop/task.py start m4-core-rpg-loop`)

## Scope

- Browser-verify M4.1–M4.3 (health/death, checkpoint/respawn, flask).
- Add Echoes currency with death drop and one recovery pickup.
- Add deterministic loot → inventory → equipment (weapon + charm) with explicit modifiers.
- Add versioned local save and complete M4 end-to-end verification.

## Non-goals

- Leveling, XP, skill trees, merchants, crafting, random loot, rarity, sockets
- Multiple checkpoints/world zones, quests, production HUD/assets
- Controller work, backend/cloud save, accounts, multiplayer, boss
- M5 systems

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
  - evidence: one `checkpoint.graybox.entry` activates through semantic F interaction; dead-only semantic R respawn restores authored transform/full health, clears player action/defense/contact state, and resets both enemy runtimes/contact dedup at their authored spawns; 34 focused tests plus lint/typecheck/diff check green

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

- [x] 0. Gate 0 — Browser replay M4.1–M4.3
  - depends: 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: Playwright browser gate script, diagnostic observation, small regression fixes only
  - outcome: interactive browser proof of health/death, checkpoint, respawn×3, flask accept/reject/refill, and M1–M3 regression smoke without console errors
  - non-goals: M4.4+ implementation before this gate passes
  - verifier: `node scripts/browser/gate0-m41-m43.mjs` against `http://127.0.0.1:4173/` → VERDICT PASS
  - evidence: PASS — 54 checks; combat damage/death×3/respawn/flask KeyE accept+reject+KeyF refill/UI isolation/no console errors; gate hook `window.__MOURNEVEIL_GATE__`

- [x] 4. M4.4 — Currency and death recovery (Echoes)
  - depends: 0
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/character/` currency runtime, enemy reward fields, world recovery marker, diagnostics, focused tests, graybox presentation
  - outcome: defeat rewards Echoes once; death drops carried Echoes into one recovery; living player recovers once; second death replaces/loses prior recovery; respawn/checkpoint do not auto-restore drops
  - non-goals: multi-currency, XP, economy framework, merchants
  - verifier: focused Echo reward/drop/recovery tests; `npm run lint`; `npm run typecheck`; HUMAN-VERIFY browser kill→earn→die→recover and second-death loss
  - evidence: PASS — skirmisher 25 / brute 60 once per lifecycle; death drop + proximity recover; zero-carried death clears prior; browser gate-m44-echoes PASS; commit `feat(progression): add Echo recovery loop`

- [x] 5. M4.5 — Loot and basic equipment
  - depends: 4
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/items/`, inventory/equipment runtimes, one deterministic loot pickup, weapon/charm modifiers, compact inventory UI, focused tests
  - outcome: authored items, ownership inventory, weapon+charm slots, resolved attack damage and max-health modifiers, deterministic loot spawn/pickup once
  - non-goals: random loot, rarity, crafting, inventory grids, generalized stat framework
  - verifier: focused item/inventory/equipment/modifier tests; UI click isolation; browser equip/unequip proof
  - evidence: PASS — oathblade +8/+12 dmg, vitality +20 max HP; skirmisher/brute authored loot; inventory UI equip isolation; gate-m45-loot PASS; commit `feat(items): add loot inventory and equipment proof`

- [x] 6. M4.6 — Versioned local save and M4 verification
  - depends: 5
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/save/`, localStorage adapter, autosave moments, load restore, final M4 acceptance matrix
  - outcome: SaveFileV1 persists stable facts only; malformed/unknown versions fall back safely; browser reload restores checkpoint/currency/recovery/inventory/equipment/flask policy; full M4 loop verified
  - non-goals: cloud save, fake historical migrations, transient combat serialization, M5
  - verifier: focused save tests; `npm run lint|typecheck|test|build|verify`; `git diff --check`; LeanLoop doctor/sync; HUMAN-VERIFY reload + end-to-end matrix
  - evidence: PASS — SaveFileV1 localStorage; recovery persisted; encounter resets on load; gate-m46-save + gate-m4-e2e PASS; 172 tests; verify green

- [x] 7. M4.7 — Repository integrity, CI determinism, and M5 readiness
  - depends: 6; Product Owner completed the M4 browser playthrough and authorized milestone closure after this gate
  - risk: HIGH
  - isolation: sequential on clean `main`, explicitly authorized by Product Owner
  - owns/allows: package-manager contract and lockfile, minimal CI, canonical repository docs/state, obsolete bootstrap artifacts, truthful runtime/debug boundaries, focused rename/refactor tests
  - outcome: npm 10.9.2 clean-installs deterministically on Node 22; current official GitHub actions run the same contract; docs/state match accepted M4; top-level runtime and development-only surfaces have truthful boundaries; all M4 browser gates and production checks remain green
  - non-goals: M5 gameplay, levels/content/world features, deployment, broad dependency upgrades, gameplay redesign
  - verifier: canonical npm 10.9.2 `npm ci`; `npm run lint`; `npm run typecheck`; `npm run test`; `npm run build`; `npm run verify`; all committed M4 browser gates; production debug-boundary inspection; `git diff --check`; `python3 scripts/leanloop/doctor.py --strict`; `python3 scripts/leanloop/sync.py --check`
  - evidence: PASS — Node 22.23.2/npm 10.9.2 clean install; zero audit findings; 172 tests; build/verify; all five M4 browser gates; production gate absent, development panel absent, inventory/canvas present, no console errors; doctor/sync/diff checks green
  - commits: `56e4075` deterministic CI · `8291cf3` runtime/debug boundaries · `9615bbc` secure browser tooling

## Parallel groups

- none — M4 gameplay authority steps are sequential

## Decisions
<!-- append-only: date | decision | reason -->

- 2026-08-09 | M3 Enemy Framework Product Owner accepted; initialize M4 Core RPG Loop | Product Owner explicitly authorized M4.1-M4.3
- 2026-08-09 | Promote the existing M3 player combat health instance rather than create a parallel health system | Preserves proven incoming-damage and combat target authority
- 2026-08-09 | M4.1-M4.3 use one checkpoint, deterministic encounter recreation, and a centralized limited flask | Smallest complete death/recovery loop before loot, equipment, and persistence
- 2026-08-09 | Respawn counts as checkpoint rest and refills the canonical flask; the mixed encounter is reset while the independent training target is preserved | Makes repeated recovery deterministic without browser reload or broad world reset
- 2026-08-09 | Product Owner authorized Gate 0 + M4.4–M4.6 in one Cursor session on `main` | Completes core RPG loop before M5
- 2026-08-09 | Provisional currency name is Echoes | Product terminology for vertical slice; not final lore lock
- 2026-08-09 | Prefer persisting active Echo recovery across reload | Prevents reload exploit restoring lost carried currency
- 2026-08-10 | M4 Core RPG Loop Product Owner accepted and CLOSED after M4.7 repository-integrity gates passed | Product Owner completed the M4 playthrough and authorized progression after this maintenance gate

## Escalation

- Any failed internal gate or HIGH-risk authority conflict stops the batch before the next step.
- Same error 3 times: stop, write a stuck report under the active task `reports/`, and escalate.

## Next milestone pointer

- **M4 Core RPG Loop — PRODUCT OWNER ACCEPTED / CLOSED**
- **M5 Connected Level — NEXT / not started.** Plan it in the next session; this task does not implement M5.
