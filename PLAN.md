# PLAN: M5 Connected Level
<!-- Live execution graph for M5 only. M4 Core RPG Loop is Product Owner accepted and closed. -->

Input: M4 accepted/closed on 2026-08-10; Product Owner authorized M5.1-M5.3 sequentially on clean `main` | Stack: `STACK.md` | Contracts: `docs/product/vertical-slice.md`, `docs/architecture/overview.md`
Task slug: `m5-connected-level` (`python3 scripts/leanloop/task.py start m5-connected-level`)

## Goal

Replace the combat-test arena with one small connected graybox level that supports traversal, encounters, checkpointing, shortcut opening, death/respawn, Echo recovery, loot, and a final gate/arena.

## Scope

- Immutable authored definitions for one connected 5-7 zone level and explicit open/gated/shortcut connections.
- Simulation-owned world flags with versioned persistence and explicit V1 migration.
- One canonical checkpoint, one meaningful shortcut, existing enemy roles/encounter authority, and one final gate boundary.
- Primitive collision-backed graybox layout playable from entry to final gate.

## Non-goals

- Boss, elite/new/ranged enemy role, waves, procedural generation, streaming, navmesh/A*, minimap
- Quests, dialogue, merchants, leveling, crafting, inventory expansion
- Production art/audio/VFX, controller, deployment
- M6 or any milestone beyond M5

## Steps

- [x] 1. M5.1 — Connected world and zone contract
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: immutable level/zone/connection definitions, world runtime flags/current-zone projection, SaveFileV2 world facts, explicit V1→V2 migration
  - outcome: valid stable zone graph; shortcut begins closed and opens deterministically; checkpoint/encounter authority remains in existing domains; old/malformed saves load safely
  - non-goals: geometry, encounter placement runtime, generic graph/scripting/streaming framework
  - verifier: `npm run lint`; `npm run typecheck`; focused world/save tests; relevant M4 save tests; `git diff --check`; focused diff review
  - evidence: PASS — six immutable authored zones and six explicit connections validate without dangling IDs; shortcut runtime opens once from its authored far side; SaveFileV2 persists stable world flags, migrates V1 explicitly, and rejects malformed/unknown versions safely; 9 focused tests plus lint/typecheck/diff check green

- [x] 2. M5.2 — Shortcut, checkpoint, and encounter placement
  - depends: 1 PASS
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: authored placements, canonical checkpoint re-authoring, semantic shortcut interaction, encounter reset policy, final-gate state contract
  - outcome: checkpoint anchors progression; shortcut opens only from far side and persists through death/load; encounter resets do not duplicate Echo/loot rewards; final gate is authored and reachable by contract
  - non-goals: presentation polish, new enemy roles, generic door/interact framework, boss
  - verifier: `npm run lint`; `npm run typecheck`; focused placement/respawn/shortcut/encounter/reward tests; M4 regressions; browser route gate when available; `git diff --check`; focused diff review
  - evidence: PASS — canonical refuge checkpoint, far-side F shortcut, three authored placements using existing skirmisher/brute roles, persistent final-gate reach, encounter recreation, V2 multi-source loot memory, and semantic world interaction; 26 focused tests and full 183-test M1-M4 suite plus lint/typecheck/diff check green; browser unavailable (no installed Playwright Chromium and no in-app browser instances)

- [x] 3. M5.3 — Complete graybox level runtime
  - depends: 2 PASS
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: primitive level geometry/colliders, gate projection, safe Echo placement rule if required, connected route integration, development route diagnostics only if necessary
  - outcome: entry→first fight→checkpoint→mixed fight→shortcut→final approach/gate is traversable; death/respawn/recovery/loot/save remain coherent
  - non-goals: visual polish, encounter tuning pass, production assets, M5.4+
  - verifier: focused level/world/physics/save integration tests; M1-M4 regressions; mandatory browser playthrough when controllable; `npm run lint`; `npm run typecheck`; `npm run test`; `npm run build`; `npm run verify`; `git diff --check`; LeanLoop doctor/sync
  - evidence: PASS — new sessions spawn at arrival; collision-backed 34×19 graybox provides arrival choke, three encounter spaces, refuge, long route, shortcut, final approach, and gated arena; safe Echo fallback clamps legacy/debug positions; 23 focused integration tests and real Rapier route/gate/perimeter proof green; full 48-file/190-test suite, lint, typecheck, build, and verify green; browser playthrough unavailable because no controllable browser instance/executable exists

- [x] 3.1. M5.3.1 — Connected-level combat and navigation correctness
  - depends: 3 PASS
  - risk: HIGH
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: melee solid-world occlusion, encounter activation policy, authored route-node navigation, combat contact diagnostics (dev), Rapier regression tests, browser correctness gates
  - outcome: no through-wall melee; no unexplained far damage; no permanent obstacle deadlock on intended M5 routes; keyboard+mouse primary
  - non-goals: navmesh/A*, new enemy roles, readability polish, controller, M5.4+
  - verifier: focused Rapier occlusion + navigation + activation tests; browser through-wall/far-damage/nav gate; lint; typecheck; `git diff --check`
  - evidence: PASS — through-wall root cause was overlap-only melee contact with no solid occlusion; far-damage root cause was all encounters active from session start so `enemy.skirmisher.introduction` chased to the refuge and hit at ~1.05m; authored zone activation + egress leash stop cross-level chase; authored route anchors replace permanent local-steer wall deadlocks; Rapier occlusion/nav/activation tests green; `scripts/browser/gate-m531-correctness.mjs` VERDICT PASS

- [x] 4. M5.4 — Level readability and environmental composition
  - depends: 3.1 PASS
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: graybox landmarks/tints, checkpoint/shortcut/gate readability, compact collapsible dev panel, inventory overflow/name presentation, training-target removal from normal M5 play, centralized milestone diagnostic
  - outcome: connected level reads as a level; UI does not obscure play; no obsolete combat-test artifacts in normal play
  - non-goals: production assets, combat authority changes
  - verifier: browser readability gate; lint; typecheck; focused UI/visual unit checks where present; `git diff --check`
  - evidence: PASS — collapsible compact dev panel; inventory displayNames + no horizontal overflow; training target removed from normal contact targets; graybox landmarks/gate markers/taller checkpoint; `gate-m54-readability.mjs` VERDICT PASS

- [x] 5. M5.5 — Encounter and traversal tuning
  - depends: 4 PASS
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: placement/activation/stand-off tuning, recovery route practicality, deterministic loot placement, navigation soak
  - outcome: deliberate combat/traversal rhythm with skirmisher+brute only
  - non-goals: waves, new roles, item system expansion
  - verifier: focused encounter/placement tests; browser soak; lint; typecheck; `git diff --check`
  - evidence: PASS — retuned intro/mixed/pressure stand-offs; egress margin 0.55; `gate-m55-tuning.mjs` PASS; M5.3.1 correctness gate still PASS

- [x] 6.1. M5.6.1 — Connected-level correctness repair
  - depends: 6 PASS + Product Owner blockers A–D
  - risk: HIGH
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: landmark/solid collision authoring, player/enemy transform sync, pointer-aim projection repair, HP-drain source fix, Rapier/browser regressions
  - outcome: no solid penetration at demonstrated props; mouse aim matches click; no unexplained HP drain; M5 regressions green
  - non-goals: M6, navmesh, new roles, polish, tag/push
  - verifier: focused collision/aim/HP tests; `gate-m561-correctness.mjs`; lint; typecheck; full test; build; doctor/sync
  - evidence: PASS — landmarks share collider+visual; defeated enemies disable solid colliders; PlayerVisual uses `localNegativeZFacingYaw`; HP soak at watch-column stable under occlusion; `gate-m561` + M5.3.1/M5.4/M5.5/M5.6 gates PASS; arrival connection moved to (−11, 5)

- [x] 6.2. M5.6.2 — Unexplained regional damage / hazard audit
  - depends: 6.1 PASS + Product Owner final-approach HP report
  - risk: HIGH
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: damage-path audit, regional HP soak tests/browser gate, attribution diagnostics; no invented hazard system
  - outcome: every regional HP loss attributed; no silent sensor/zone damage; no HIGH-risk authority redesign required before M6
  - non-goals: inventing traps; M6 presentation; combat redesign
  - verifier: `regionalDamage.integration.test.ts`; `gate-m562-regional-hp.mjs`; lint; typecheck; `git diff --check`
  - evidence: PASS — no environmental hazard system exists; neutralized soaks in all authored zones keep HP stable; live final-approach drain attributes exclusively to `enemy.skirmisher.pressure` (`encounter.m5.pressure`); inactive/defeated enemies cannot damage; one-hit-per-execution holds; save/respawn do not duplicate sources

# PLAN: M6 Presentation and Playable Identity
<!-- Presentation milestone. Do not change combat/world authority. -->
Task slug: `m6-presentation` (`python3 scripts/leanloop/task.py start m6-presentation`)

## Goal

Move Mourneveil from technical graybox toward a coherent dark-fantasy playable vertical slice without replacing stable gameplay authority.

## Scope

- Distinct procedural actor/world silhouettes and landmarks
- Gameplay HUD + combat readability; Details panel remains collapsed-by-default and DEV-only
- Centralized dark-fantasy palette, lighting, environment composition
- Combat/interaction presentation polish driven by authoritative events
- Full browser playthrough + M5 correctness regressions + production boundary
- PO visual-quality correction: state separation, occlusion/solidity truth, game-grade UI, raised actor/environment quality

## Non-goals

- Production character models, animation packs, audio, postprocessing stack
- Boss/new roles/ranged/leveling/quests/minimap/controller/deployment/navmesh
- M7

## Steps

- [x] 1. M6.1 — Actor and world presentation foundation
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: player/enemy silhouettes, defeated presentation, checkpoint/Echo/loot/gate visuals (procedural only)
  - outcome: Details collapsed, tester identifies player/skirmisher/brute/checkpoint/Echo/loot/shortcut/final gate
  - non-goals: combat authority changes; production assets
  - verifier: browser identity gate; lint; typecheck; `git diff --check`
  - evidence: PASS — EnemyVisual resolves by definitionId (fixes invisible introduction/pressure); distinct player/skirmisher/brute silhouettes; shrine checkpoint; Echo octahedron; compact loot; gate language; `gate-m61-presentation` PASS

- [x] 2. M6.2 — Gameplay HUD and combat readability
  - depends: 1 PASS
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: gameplay HUD, inventory readability, combat projection states, Details policy
  - outcome: play without Details; HP/flask/Echoes/weapon/charm/prompts readable; combat states readable
  - verifier: browser HUD/combat gate; lint; typecheck; `git diff --check`
  - evidence: PASS — GameplayHud HP bar/flasks/Echoes/gear/prompts; collapsible loadout; Details collapsed+DEV-only; `gate-m62-hud` PASS

- [x] 3. M6.3 — Dark-fantasy environment and visual identity
  - depends: 2 PASS
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: palette/theme, zone composition, lighting, grid policy
  - outcome: route/zone identity readable; no visual/collider contradiction
  - verifier: browser identity playthrough; lint; typecheck; `git diff --check`
  - evidence: PASS — `mourneveilPalette`; fog + dual-key lighting; zone decorative landmarks without new solids; gate/checkpoint lights

- [x] 4. M6.4 — Combat presentation and interaction polish
  - depends: 3 PASS
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: attack/telegraph/hit/guard/dodge/interaction feedback (presentation-only)
  - outcome: repeated actions readable without Details
  - verifier: browser feedback gate; lint; typecheck; `git diff --check`
  - evidence: PASS — heavier light/heavy poses; damage/guard camera impulse; player/enemy hit flash; dodge pose; distinct telegraphs

- [x] 5. M6.5 — Full visual/gameplay browser verification
  - depends: 4 PASS
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: end-to-end SaveFileV2 playthrough; M5 correctness re-runs
  - outcome: full loop playable with Details collapsed; no console errors
  - verifier: presentation playthrough + M5 gates; lint; typecheck; test; build
  - evidence: PASS — `gate-m65-presentation`; `gate-m531`/`gate-m561`/`gate-m562` PASS; verify 226 tests green

- [x] 6. M6.6 — Hardening and M6 acceptance gate
  - depends: 5 PASS
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: bounded visual/UI cleanup; production boundary; soak
  - outcome: production build lacks DEV mutations/Details; HUD present; soak clean
  - verifier: `npm run verify`; production preview; doctor/sync; `git diff --check`
  - evidence: PASS automated — PO later rejected visual quality; correction continues as M6.7–M6.10

- [x] 7. M6.7 — Repository state separation + occlusion/collision truth
  - depends: 6 PASS + PO visual rejection
  - risk: MEDIUM–HIGH (stop if true HIGH-risk collision redesign)
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: m6-presentation task state; decorative-solidity contract; presentation-only camera occlusion fade
  - outcome: M5/M6 HANDOFFs separated; no fake solid visuals; actors readable behind foreground walls; no physics weaken
  - verifier: focused occlusion tests; browser occlusion gate; lint; typecheck; `git diff --check`
  - evidence: PASS — task `m6-presentation`; decorative lintels/rubble only; `CameraOcclusionFader`; `gate-m67-occlusion` PASS; no HIGH-risk collision redesign

- [x] 8. M6.8 — Game-grade HUD and UI redesign
  - depends: 7 PASS
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: HUD composition, typography/frame tokens, inventory overlay, F3 DEV details, I loadout
  - outcome: play without web-app chrome; game UI language
  - verifier: browser UI gate; lint; typecheck; `git diff --check`
  - evidence: PASS — F3 DEV details; I Armory; bottom-left status + command strip; `uiTheme`; `gate-m68-ui` PASS

- [x] 9. M6.9 — Dark-fantasy actor/environment quality pass
  - depends: 8 PASS
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: procedural actor silhouettes, environment breakup, lighting, combat presentation
  - outcome: no longer reads as toy/student prototype
  - verifier: browser quality gate; lint; typecheck; `git diff --check`
  - evidence: PASS — hooded player; lean skirmisher; armored brute; shrine checkpoint; tile seams; localized lights

- [x] 10. M6.10 — Full presentation and correctness acceptance
  - depends: 9 PASS
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: screenshot-quality review; M5 regressions; production boundary; soak
  - outcome: ready for Product Owner acceptance (agent does not self-accept)
  - verifier: `npm run verify`; all M5/M6 gates; doctor/sync; `git diff --check`
  - evidence: PASS automated — `gate-m610-quality`; `gate-m531`/`m561`/`m562`/`m66`/`m67`/`m68`; verify 229 tests; doctor/sync OK; **PO acceptance pending**

## Parallel groups

- none — presentation builds on M5 authority sequentially

## Decisions

- 2026-08-10 | M4 Core RPG Loop is Product Owner accepted/closed; initialize M5 Connected Level | Explicit Product Owner authorization
- 2026-08-10 | Save world progression through SaveFileV2 with explicit V1 migration | V1 shape is immutable; opened shortcut is a new stable fact
- 2026-08-10 | Checkpoint rest/death respawn recreate all connected-level enemies, preserve opened shortcuts and loot-once memory, and never grant Echoes during reset | Keeps traversal progress and rewards deterministic across recovery cycles
- 2026-08-10 | Shape the graybox around direct pursuit and local steering: open encounter rooms, sparse blockers, and no route that requires navmesh | Respects the accepted M3 navigation boundary
- 2026-08-10 | Melee hits require overlap AND solid-world occlusion clear; M5 encounters activate on zone entry with egress leash; blocked pursuit uses authored connection/detour anchors | Product Owner M5.3.1 blockers B1–B3
- 2026-08-10 | No environmental hazard/trap system; regional HP loss must attribute to authored enemy melee or be treated as a bug | M5.6.2 Product Owner audit
- 2026-08-10 | M5 tagged `v0.5.0-connected-level`; authorized M5.6.2 then M6 presentation macro-batch on `main` | Explicit Product Owner authorization
- 2026-08-11 | M6.1–M6.6 not PO-accepted; correction batch M6.7–M6.10 on task `m6-presentation`; Vesperfall is principle benchmark only | Explicit Product Owner correction
- 2026-08-11 | Decorative non-solid geometry must not visually read as gameplay-blocking walls/pillars; camera occlusion fade is presentation-only | M6.7 solidity/occlusion contract

## Escalation

- Any failed internal gate or HIGH-risk authority conflict stops the batch before the next step.
- Same error three times: write a stuck report under the active task and stop.
