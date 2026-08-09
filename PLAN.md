# PLAN: M3 Enemy Framework
<!-- Live execution graph for M3 only. M2 Combat Proof is Product Owner accepted. -->

Input: M2 accepted by Product Owner on 2026-08-09 | Stack: `STACK.md` | Contracts: `docs/product/vertical-slice.md`, `docs/architecture/overview.md`
Task slug: `m3-enemy-framework` (`python3 scripts/leanloop/task.py start m3-enemy-framework`)

## Non-goals
- Boss framework
- Loot / inventory expansion
- Player health beyond the narrow deterministic M3 incoming-melee proof contract
- Healing, regeneration, flask, armor, resistances, status effects, full death/respawn, production health HUD, or a generalized RPG-stat framework
- Stamina
- Complex navmesh / general pathfinding unless demonstrated necessary for graybox pursuit
- Procedural spawning / waves framework
- Ranged enemy before melee framework is proven
- Production models / animations
- Multiplayer / backend
- Do not reopen M2 combat authority unless a regression blocks M3

## Resolved M3 player-health scope
- Allowed only for M3 enemy incoming-melee proof: deterministic player combat health with maximum/current values, alive/defeated state, clamped `applyDamage`, and development-only reset/diagnostic.
- Prohibited: healing, regeneration, flask, armor, resistances, status effects, full player death/respawn, production health HUD, and a generalized RPG-stat framework.
- Player zero health may freeze the development fixture; it does not authorize checkpoint or respawn behavior.

## Steps
<!-- risk: LOW|MEDIUM|HIGH ; isolation: inline|sequential|worktree -->

- [x] 0. M3.0 — CI verification repair and M3 foundation planning
  - depends: —
  - risk: LOW
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: `.github/workflows/`, lockfile sync, PLAN/task state, current-state, M2 closure docs
  - outcome: CI `npm ci` succeeds; M2 closed as PO-accepted; M3 graph initialized; M3.1 not started
  - non-goals: enemy runtime, AI, combat behavior changes
  - verifier: `npm ci && npm run verify && git diff --check && python3 scripts/leanloop/doctor.py --strict && python3 scripts/leanloop/sync.py --check`
  - evidence: CI failed on Install dependencies with EUSAGE missing `@emnapi/core@1.11.3` / `@emnapi/runtime@1.11.3`; lockfile regenerated with npm 10 package-lock-only so peers are recorded

- [x] 1. M3.1 — Enemy runtime and state authority
  - depends: 0
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential (clean tree / worktree if main dirty)
  - owns/allows: `src/game/enemies/` contracts + runtime, minimal combat/hurtbox integration, focused pure tests, M3 task state
  - outcome: immutable enemy definition contract; mutable enemy runtime state; deterministic state machine; health/hurtbox integration using existing combat authority; no navigation complexity; no production assets
  - non-goals: AI pursuit, attacks, navmesh, presentation, player health, multiple roles
  - verifier: focused enemy-runtime tests plus `npm run verify && git diff --check`
  - completion evidence: deterministic state transitions and hurtbox/health contract tests green; PLAN/HANDOFF updated
  - evidence: immutable enemy definitions and stable instance identity; shared combat health/hurtbox authority; explicit transition/action ownership; focused enemy + combat tests 47/47; full verify 103/103 and build green

- [x] 2. M3.2 — First melee enemy behavior
  - depends: 1
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: perception, pursue, telegraph, committed attack, recovery, player-directed contact contract, simple defeat, one deterministic melee enemy
  - outcome: one melee enemy exercises the M3.1 runtime through a complete attack/defeat loop
  - gate: M3.1 internal gate must pass before implementation begins
  - non-goals: role variants, navmesh framework, ranged enemies, production animation, and player health beyond the resolved narrow M3 proof contract
  - verifier: focused melee-behavior tests plus M2 combat regressions and `npm run verify && git diff --check`
  - completion evidence: deterministic pursue/telegraph/attack/recovery/defeat proven; runtime proof recorded
  - evidence: one grounded melee instance detects by distance, pursues through the Rapier character-controller boundary, snapshots attack facing, resolves one contact per execution, respects authoritative dodge and a 120° forward guard cone, takes existing light/heavy damage, and halts at defeat; focused M3/M2 tests 71/71, M1 regressions 13/13, full suite 118/118, build green; browser backend unavailable, local endpoint HTTP 200 only

- [x] 3. M3.3 — Enemy movement/navigation, spacing, and attack-facing correctness
  - depends: 2
  - risk: HIGH
  - preferred agent: Codex for authority; Cursor for tuning
  - isolation: sequential
  - owns/allows: one accepted execution-facing snapshot shared by telegraph/contact, collision-safe pursuit, authored spacing hysteresis, and simple graybox obstacle behavior
  - outcome: melee enemy attack presentation and contact agree for cardinal/side directions; pursuit/spaces without player or graybox penetration; no general navmesh unless required by evidence
  - non-goals: full navmesh platform, crowd simulation, stealth AI
  - verifier: focused enemy-facing and movement/spacing tests + real Rapier enemy collision tests + M3.2/M2/M1 regressions + `npm run verify && git diff --check`
  - completion evidence: exact facing root cause recorded; execution-facing, pursuit/stop hysteresis, and obstacle behavior verified; browser smoke recorded
  - evidence: corrected mirrored local -Z presentation yaw; explicit per-execution facing now drives telegraph/contact/guard; authored 1.28 m stop and 1.48 m pursuit-resume thresholds prevent flapping; deterministic collision probes route around the center blocker and respect player/perimeter bodies in real Rapier tests; 130/130 full tests and build green; browser backend unavailable, local endpoint HTTP 200 only

- [x] 3.1. M3.3.1 — Enemy runtime liveness regression
  - depends: 3
  - risk: HIGH
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: liveness root-cause fix, diagnostic milestone accuracy, regression tests, browser soak gate
  - outcome: living enemy with living target cannot permanently stall in a non-terminal state; defeated-player path still advances committed action clocks into idle
  - non-goals: timeout resets, teleports, forced re-aggro, controller work, M3.4 variants
  - verifier: focused liveness tests + browser soak + `npm run verify && git diff --check`
  - completion evidence: exact root cause recorded; browser multi-cycle soak pass
  - evidence: root cause was `advanceMeleeEnemy` gated on `playerAlive`, freezing mid-attack/recovery while simulation kept running; also soft-lock escapes for null resolver / near-zero collision step inside attack range; milestone diagnostic → M3.3.1; browser gate pass (defeat→idle, reset cycles, roam); commit `6d709aa`

- [x] 4. M3.4 — Enemy role variants
  - depends: 3.1
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: small data-driven variants (e.g. skirmisher, brute; ranged only if framework ready)
  - outcome: at most a small number of variants from the established framework; stop after the second variant if it exposes framework gaps
  - non-goals: large roster, boss, loot tables
  - verifier: variant definition tests + `npm run verify && git diff --check`
  - completion evidence: variants share M3.1 authority without forked runtimes
  - evidence: existing melee converted to skirmisher; brute added; shared `advanceMeleeEnemy` + `EnemyRuntime`; per-enemy collision resolvers and contact runtimes; browser dual-role smoke pass; commit `106d063`

- [x] 5. M3.5 — Encounter proof and enemy presentation
  - depends: 4
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: small mixed encounter, readable telegraphs, graybox presentation, enemy gallery/debug fixture
  - outcome: readable encounter proof without production art
  - non-goals: production VFX/audio, cinematic camera, content pipeline
  - verifier: `npm run verify && git diff --check` plus HUMAN-VERIFY browser encounter pass
  - completion evidence: runtime observations recorded; no authority drift
  - evidence: `encounter.graybox.mixed` completes only when both roles defeated; role-tinted graybox presentation; telegraph/contact only during startup/active; browser soak saw both roles live + reset restores active; Vite chunk advisory non-blocking

- [x] 6. M3.6 — M3 verification
  - depends: 5
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: deterministic enemy fixtures, browser verification, combat regressions, PO acceptance gate
  - outcome: M3 ready for Product Owner acceptance; limitations explicit
  - non-goals: new enemy features, M4 planning beyond a pointer
  - verifier: `npm run verify && git diff --check` plus HUMAN-VERIFY Playwright/browser Combat+Enemy proof
  - completion evidence: acceptance matrix recorded; M3 closed or blocked with evidence
  - evidence: milestone diagnostic M3.6; long-run/isolation/encounter verification tests; browser soaks A–D + combat/UI matrix pass with no console errors; 149/149 tests; full verify green; classification READY FOR PRODUCT OWNER ACCEPTANCE

## Parallel groups
- none — M3 authority steps are sequential

## Decisions
<!-- append-only: date | decision | reason -->
- 2026-08-09 | M2 Combat Proof Product Owner accepted; initialize M3 Enemy Framework graph | PO authorized M3.0 after M2 acceptance
- 2026-08-09 | CI `npm ci` failure was lockfile incompleteness for `@emnapi/core@1.11.3` and `@emnapi/runtime@1.11.3` peer installs; regenerate lock with npm 10 | Matches GitHub Actions Node 22 / npm 10 clean-install contract without bypassing npm ci
- 2026-08-09 | Player incoming-damage/health for enemy attacks remains an explicit unresolved PLAN gate | Prevents repeating the M2 training-target-health scope conflict
- 2026-08-09 | Authorize minimal deterministic player combat health only for M3 enemy incoming-melee proof | Product Owner explicitly allowed max/current health, alive/defeated, clamped damage, and development reset/diagnostic while prohibiting broader health/RPG systems
- 2026-08-09 | Accepted enemy attacks own one enemy-to-player facing snapshot; telegraph, contact, and defense consume it while pursuit uses authored stop/resume hysteresis and simulation-owned local collision steering | Fixes the M3.2 directional mismatch without presentation authority or a navmesh framework
- 2026-08-09 | Enemy AI must keep advancing when the player is defeated; do not gate `advanceMeleeEnemy` on player alive | Prevents permanent non-terminal stall while the simulation clock remains running
- 2026-08-09 | Graybox roles are data packages (skirmisher/brute) over one melee runtime; multi-enemy needs per-instance collision and contact dedup | Proves M3 architecture is data-driven without forked state machines
- 2026-08-09 | M3.6 adds development-only `Reset player health` without restoring enemies/encounter | Lets soak/verification continue after player defeat without clearing the mixed encounter fixture

## Escalation
- Same error 3 times: stop, write a stuck report under the active task `reports/`, and escalate
- Failed branch owner: orchestrator on the integration tree; never mix unrelated dirty-main changes

## Next milestone pointer
- After M3.6 PO acceptance only — do not plan boss content in M3
