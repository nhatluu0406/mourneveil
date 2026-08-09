# PLAN: M3 Enemy Framework
<!-- Live execution graph for M3 only. M2 Combat Proof is Product Owner accepted. -->

Input: M2 accepted by Product Owner on 2026-08-09 | Stack: `STACK.md` | Contracts: `docs/product/vertical-slice.md`, `docs/architecture/overview.md`
Task slug: `m3-enemy-framework` (`python3 scripts/leanloop/task.py start m3-enemy-framework`)

## Non-goals
- Boss framework
- Loot / inventory expansion
- Player health system unless explicitly resolved by PLAN decision before the step that needs it
- Stamina
- Complex navmesh / general pathfinding unless demonstrated necessary for graybox pursuit
- Procedural spawning / waves framework
- Ranged enemy before melee framework is proven
- Production models / animations
- Multiplayer / backend
- Do not reopen M2 combat authority unless a regression blocks M3

## Unresolved scope decision (must resolve before the first step that needs it)
- **Player incoming-damage / health proof:** M3 enemy attacks may require proving contact against the player. Do **not** silently implement player health. Before M3.2 (or whichever step first needs inbound player damage), append an explicit PLAN decision authorizing either (a) a narrow player-damage/health proof contract analogous to M2.3 training-target health, or (b) an alternate proof that avoids player health. Until then, enemy attack work must stop at telegraph/contact-contract design without applying player damage.

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

- [ ] 1. M3.1 — Enemy runtime and state authority
  - depends: 0
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential (clean tree / worktree if main dirty)
  - owns/allows: `src/game/enemies/` contracts + runtime, minimal combat/hurtbox integration, focused pure tests, M3 task state
  - outcome: immutable enemy definition contract; mutable enemy runtime state; deterministic state machine; health/hurtbox integration using existing combat authority; no navigation complexity; no production assets
  - non-goals: AI pursuit, attacks, navmesh, presentation, player health, multiple roles
  - verifier: focused enemy-runtime tests plus `npm run verify && git diff --check`
  - completion evidence: deterministic state transitions and hurtbox/health contract tests green; PLAN/HANDOFF updated

- [ ] 2. M3.2 — First melee enemy behavior
  - depends: 1
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: perception, pursue, telegraph, committed attack, recovery, player-directed contact contract, simple defeat, one deterministic melee enemy
  - outcome: one melee enemy exercises the M3.1 runtime through a complete attack/defeat loop
  - gate: resolve the player incoming-damage/health PLAN decision before applying damage to the player
  - non-goals: role variants, navmesh framework, ranged enemies, production animation
  - verifier: focused melee-behavior tests plus M2 combat regressions and `npm run verify && git diff --check`
  - completion evidence: deterministic pursue/telegraph/attack/recovery/defeat proven; runtime proof recorded

- [ ] 3. M3.3 — Enemy movement/navigation and spacing
  - depends: 2
  - risk: HIGH
  - preferred agent: Codex for authority; Cursor for tuning
  - isolation: sequential
  - owns/allows: collision-safe pursuit, stopping distance, simple graybox obstacle behavior
  - outcome: melee enemy pursues/spaces without penetrating graybox collision; no general navmesh unless required by evidence
  - non-goals: full navmesh platform, crowd simulation, stealth AI
  - verifier: focused movement/spacing tests + collision regressions + `npm run verify && git diff --check`
  - completion evidence: pursuit/stop distance and obstacle behavior verified; browser smoke recorded

- [ ] 4. M3.4 — Enemy role variants
  - depends: 3
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: small data-driven variants (e.g. skirmisher, brute; ranged only if framework ready)
  - outcome: at most a small number of variants from the established framework; stop after the second variant if it exposes framework gaps
  - non-goals: large roster, boss, loot tables
  - verifier: variant definition tests + `npm run verify && git diff --check`
  - completion evidence: variants share M3.1 authority without forked runtimes

- [ ] 5. M3.5 — Encounter proof and enemy presentation
  - depends: 4
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: small mixed encounter, readable telegraphs, graybox presentation, enemy gallery/debug fixture
  - outcome: readable encounter proof without production art
  - non-goals: production VFX/audio, cinematic camera, content pipeline
  - verifier: `npm run verify && git diff --check` plus HUMAN-VERIFY browser encounter pass
  - completion evidence: runtime observations recorded; no authority drift

- [ ] 6. M3.6 — M3 verification
  - depends: 5
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: deterministic enemy fixtures, browser verification, combat regressions, PO acceptance gate
  - outcome: M3 ready for Product Owner acceptance; limitations explicit
  - non-goals: new enemy features, M4 planning beyond a pointer
  - verifier: `npm run verify && git diff --check` plus HUMAN-VERIFY Playwright/browser Combat+Enemy proof
  - completion evidence: acceptance matrix recorded; M3 closed or blocked with evidence

## Parallel groups
- none — M3 authority steps are sequential

## Decisions
<!-- append-only: date | decision | reason -->
- 2026-08-09 | M2 Combat Proof Product Owner accepted; initialize M3 Enemy Framework graph | PO authorized M3.0 after M2 acceptance
- 2026-08-09 | CI `npm ci` failure was lockfile incompleteness for `@emnapi/core@1.11.3` and `@emnapi/runtime@1.11.3` peer installs; regenerate lock with npm 10 | Matches GitHub Actions Node 22 / npm 10 clean-install contract without bypassing npm ci
- 2026-08-09 | Player incoming-damage/health for enemy attacks remains an explicit unresolved PLAN gate | Prevents repeating the M2 training-target-health scope conflict

## Escalation
- Same error 3 times: stop, write a stuck report under the active task `reports/`, and escalate
- Failed branch owner: orchestrator on the integration tree; never mix unrelated dirty-main changes

## Next milestone pointer
- After M3.6 PO acceptance only — do not plan boss content in M3
