# PLAN: M9 Combat Depth — Hit Reaction / Interrupt
<!-- Live M9 graph only. -->

Input: Product Owner M9 macro-batch 2 | Stack: `STACK.md` | Task: `m9-combat-depth`

## Goal

Add one deterministic enemy hit-reaction/interrupt slice: existing player heavy attacks can interrupt eligible enemies into a short simulation-owned stun, without posture meters or combat redesign.

## Non-goals

- Stamina/posture/poise, knockback/ragdoll, parry, combo trees, new light/heavy architecture, new enemies/weapons/art, M10, closing/tagging M9.

## Steps

- [x] 0. Recon + lock interrupt contract
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: PLAN locked contract; read-only combat/enemy/animation audit in HANDOFF
  - verifier: PLAN documents trigger (existing heavy), skirmisher/brute rules, phases, anti-stunlock, duration
  - evidence: PASS; existing light/heavy attacks reused; no new attack architecture.
- [x] 1. Authoritative enemy hit-reaction runtime
  - depends: 0
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `enemyRuntime`, `enemyHitReaction`, `meleeEnemy` AI gating, `GameRuntime` post-hit application, focused tests
  - verifier: focused hit-reaction tests A–K (incl. guard regressions)
  - evidence: PASS; unit + integration suites green; guard/contact regressions green.
- [x] 2. Presentation projection only
  - depends: 1
  - risk: LOW
  - isolation: sequential
  - owns/allows: M7 enemy animation projection reuse; no new VFX architecture
  - verifier: hit-reaction mode driven by simulation state; M7 animation regressions green
  - evidence: PASS; `projectEnemyAnimation` prefers sim `hitReaction` token.
- [x] 3. Deterministic M9 runtime gate
  - depends: 1, 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: one owned Playwright gate via existing lifecycle; package script
  - verifier: `npm run gate:m9-hit-reaction` PASS; owned cleanup/port reuse
  - evidence: PASS; in-page sequenced probe; port 4195 reusable.
- [x] 4. Verify and hand off
  - depends: 1, 2, 3
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: PLAN/HANDOFF/current-state/REPOMAP; DEBT only if real deferred limitation
  - verifier: full verify + lifecycle + doctor/sync/git guard
  - evidence: PASS; 70 files/303 tests; assets/build; lifecycle; doctor/sync.

## Locked contract

- Trigger: existing player **heavy** attack contact (`interruptImpact: 1`); light remains `0` (damage only, presentation flash may remain).
- Skirmisher threshold `1` → one heavy interrupts. Brute threshold `2` → two separate heavy executions required.
- Interruptible: idle/pursue/spacing, attack startup, attack recovery. Non-interruptible: attack **active**, defeated, already in hitReaction, post-reaction immunity.
- On interrupt: cancel enemy action, clear execution facing, zero velocity, enter `hitReaction` for 20 fixed steps; then resume pursue (keep target) or idle.
- Anti-stunlock: no re-entry while reacting; same `executionId` cannot apply twice; 12-step post-reaction immunity; interrupt meter quiet-resets after 90 steps.
- Damage authority unchanged; reaction is a consequence of already-deduped `damaged` hits. Transient / unsaved.

## Escalation

- Stop if interrupt requires redesigning CombatContact/guard ownership or a posture subsystem.
- Same failure three times: stuck report and stop.
