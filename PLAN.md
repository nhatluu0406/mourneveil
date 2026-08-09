# PLAN: M2 Combat Proof
<!-- Live execution graph for M2 only. M1 is accepted; do not broaden this milestone beyond Combat Proof. -->

Input: M1 accepted by Product Owner on 2026-08-09 | Stack: `STACK.md` | Contracts: `docs/product/vertical-slice.md`, `docs/architecture/overview.md`
Task slug: `m2-combat-proof` (`python3 scripts/leanloop/task.py start m2-combat-proof`)

## Non-goals
- Boss, loot, inventory, enemy framework, production animation systems
- Combos, lock-on, VFX, audio, content production
- ECS, global event bus, physics redesign, camera or locomotion retuning
- Player health, healing/regeneration, armor/resistances/status effects, production health UI, broader survival systems
- General-purpose RPG health framework or enemy AI/death framework
- Stamina implementation beyond what a later defensive step explicitly authorizes

<!-- M2.3 exception: a narrow training-target health contract is allowed only as listed under step 3. -->

## Steps
<!-- risk: LOW|MEDIUM|HIGH ; isolation: inline|sequential|worktree -->

- [x] 1. M2.1 — Combat action contract foundation
  - depends: —
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential (clean tree / worktree if main is dirty)
  - owns/allows: `src/game/combat/`, minimal simulation/debug integration, focused pure tests, M2 task state
  - outcome: immutable typed action definitions; deterministic single-action runtime; explicit cancellation/interruption; semantic request, resource-validation, and contact-window contracts; debug-only diagnostic proof
  - non-goals: attack input wiring, visible attacks, animation authority, hitboxes, damage, enemies, health, stamina state, dodge, guard, combos
  - verifier: `npm run test -- src/game/combat && npm run lint && npm run typecheck`
  - completion evidence: required deterministic phase/policy tests green; diagnostic exposes authoritative action state; full verification green; PLAN/HANDOFF/CHECKPOINT updated

- [x] 2. M2.2 — Player attack actions
  - depends: 1
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: player combat actions, semantic player attack input, narrow character integration, focused tests
  - outcome: edge-triggered LMB/Shift+LMB light/heavy requests consume the M2.1 contract; fixed-step phases drive committed movement, persistent facing, primitive sweep projection, and facing-relative contact spheres without resolving hits
  - non-goals: damage resolution, enemy framework, production animations, dodge, guard
  - verifier: focused player-combat tests plus `npm run verify && git diff --check`
  - completion evidence: deterministic action requests and phase progression verified; runtime proof recorded

- [x] 3. M2.3 — Contact and damage proof
  - depends: 2
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: narrow contact query, one deterministic training-target fixture, minimal training-target health/damage contract, development-only target health diagnostic, focused tests
  - outcome: an authoritative active window can produce one validated contact and apply deterministic damage to a stationary training target until it is defeated
  - authorized training-target health (M2.3 only): max/current health; deterministic damage application; alive/defeated state required for contact proof; development-only target health diagnostic
  - non-goals: player health; healing/regeneration; armor/resistances/status effects; general-purpose health framework; production health UI; enemy AI/death framework; hit reactions; loot; broad hitbox system
  - verifier: focused contact/damage tests plus `npm run verify && git diff --check`
  - completion evidence: deterministic contact fixture and single-hit policy verified; training-target defeat path proven; runtime proof recorded
  - evidence: execution IDs, Rapier sphere queries, per-execution target dedup, 20/35 light/heavy damage, clamped target health, and fixed-step sequencing covered; focused sets and full 18-file/73-test verification green; Vite HTTP 200; browser interaction unavailable

- [x] 4. M2.4 — Defensive mechanics and combat-input correctness
  - depends: 3
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: semantic mouse-world attack aim, gameplay pointer ownership/lifecycle fixes, one dodge action, minimal guard state, explicit action-policy integration, focused tests
  - outcome: clicked-world attack facing is snapshotted per execution; UI pointer events cannot request combat; border/action input lifecycle recovers without RMB; deterministic dodge and guard use simulation authority
  - non-goals: broad stamina system, parry tree, lock-on, animation framework, controller combat input
  - verifier: focused aim/input/border/defense tests plus M1/M2 regressions and `npm run verify && git diff --check`
  - completion evidence: all three blocking input regressions, timing/cancel/interrupt interactions, dodge collision/invulnerability, and guard lifecycle verified; runtime proof recorded
  - evidence: canvas-only pointer input and semantic ground-plane aim replace window-wide LMB; pointer exit/cancel/outside release resets stale held input; attacks snapshot accepted aim; Space dodge uses 2/8/8 fixed steps with active-only invulnerability and Rapier collision; held RMB guard constrains movement to 35%; focused and full 22-file/84-test verification green; browser replay unavailable and remains manual

- [x] 5. M2.5 — Combat runtime correctness and presentation feel
  - depends: 4
  - risk: MEDIUM (with HIGH-priority PO correctness gate)
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: aim/contact facing authority alignment, debug geometry cleanup, presentation-only combat readability, primitive hit feedback, scoped feel tuning under fixed contracts
  - outcome: click aim, attack visual, and authoritative contact share one execution-facing snapshot; away/perp attacks miss; Combat Proof actions/results are readable without presentation becoming authority
  - first acceptance gate (PO findings): visible attack direction follows click; contact matches the same execution facing; attacking away from the target deals no damage; Reset-target UI stays isolated; border stuck regression remains fixed; browser verification required
  - non-goals: production animation pipeline, final VFX/audio, camera redesign, enemy AI, player health, stamina, controller combat, M2.6
  - verifier: focused aim/contact regressions + M1/M2 suites + `npm run verify && git diff --check` plus HUMAN-VERIFY browser combat correctness/readability pass
  - completion evidence: runtime observations recorded; no authority drift
  - evidence: frozen `attackExecutionFacing` drives presentation + contact; camera `updateMatrixWorld` before ray aim; weapon sweep reduced so readable axis matches contact; training-target facing marker removed; player facing marker recolored as debug chevron; presentation-only hit flash/recoil + tiny camera impulse; 23 files / 98 tests; Playwright browser matrix green (cardinals/diag aim, toward hit / away+perp miss, Reset isolation, border recovery, dodge/guard, no console errors)

- [x] 6. M2.6 — Combat verification
  - depends: 5
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: deterministic verification fixture and concise milestone evidence only; preserve approved local Vite host/port pin
  - outcome: complete Combat Proof happy path is reproducible and M2 limitations are explicit
  - non-goals: new combat features, content expansion, deployment, M3
  - verifier: `npm run verify && git diff --check` plus HUMAN-VERIFY Playwright Combat Proof at `http://127.0.0.1:4173/`
  - completion evidence: automated gates and browser acceptance pathway recorded; M2 ready for Product Owner acceptance
  - evidence: Vite pinned to `127.0.0.1:4173` (`strictPort`); full 23-file/98-test verify + doctor/sync green; Playwright Chromium matrix PASS (movement, light/heavy, directions, directional hit/miss, aim freeze, target lifecycle, dodge, guard, interaction/lifecycle regressions, no uncaught errors); acceptance matrix at `state/tasks/m2-combat-proof/reports/`

## Parallel groups
- none — M2 steps share combat authority and execute sequentially

## Decisions
<!-- append-only: date | decision | reason -->
- 2026-08-09 | M1 accepted and closed; initialize a fresh M2 Combat Proof graph | Product Owner explicitly authorized M2.1
- 2026-08-09 | Combat action durations are positive integer simulation steps; phase transitions are runtime authority and contact is exposed only during an action's active phase | Deterministic 60 Hz progression without animation-frame authority
- 2026-08-09 | Voluntary cancellation and forced interruption use separate typed phase-window policies; resource validation is injected at start | Proves future policy and stamina seams without implementing those systems
- 2026-08-09 | Light is 8/4/14 steps and heavy is 18/6/30 steps for startup/active/recovery; both have zero cooldown/resource cost | One authoritative provisional 60 Hz definition location with clearly distinct commitment
- 2026-08-09 | Player facing follows meaningful movement, persists while neutral, and is frozen while startup/active/recovery suppress locomotion intent | Stable deterministic attack direction without camera or mouse-world aiming
- 2026-08-09 | Each attack owns a facing-relative sphere definition; spatial contact is exposed only when its authoritative contact window is active | Gives M2.3 a narrow query contract without hit or damage resolution
- 2026-08-09 | M2 non-goals ban player/general health systems, but M2.3 may implement a narrow training-target health contract for contact/damage proof | Removes false PLAN conflict blocking M2.3 without authorizing a reusable health/survival framework
- 2026-08-09 | Attack executions use simulation-owned monotonic IDs; Rapier reports active-sphere/hurtbox candidates, while simulation deduplicates target hits and applies deterministic light/heavy damage of 20/35 | Proves contact and damage without render, callback frequency, or wall-clock authority
- 2026-08-09 | Canvas pointer ownership produces semantic ground-plane aim; accepted attacks freeze that aim, while pointer lifecycle resets all held gameplay input | Prevents UI click leakage, animation authority, and missed-release input stalls
- 2026-08-09 | Dodge is a strict non-cancelling 2/8/8-step action with collision-resolved active movement and active-only invulnerability; guard is an idle-only held state with constrained locomotion | Establishes deterministic defensive authority without stamina, parry, or incoming-damage systems
- 2026-08-09 | Accepted attacks own a frozen execution-facing snapshot that exclusively drives presentation orientation and contact-shape orientation; live movement facing/mouse/render rotation cannot retarget an in-flight execution | Closes PO aim/contact disagreement without a second combat state machine
- 2026-08-09 | M2.5 hit feedback and camera impulse are presentation-only and must not author damage or pause fixed-step authority | Keeps feel improvements from corrupting combat/simulation contracts
- 2026-08-09 | Local Vite development binds predictably to `127.0.0.1:4173` with `strictPort` | Deterministic local verification endpoint; avoids reserved-port bind failures without dynamic fallback

## Escalation
- Same error 3 times: stop, write a stuck report under the active task `reports/`, and escalate
- Failed branch owner: orchestrator on the integration tree; never mix unrelated dirty-main changes

## Next milestone
- Product Owner acceptance of M2 Combat Proof (no M3 started)
