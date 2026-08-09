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
- M5.4-M5.6 implementation in this session

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

- [ ] 4. M5.4 — Level readability and environmental composition
  - depends: 3
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - outcome: improve graybox landmarks, sightlines, route legibility, and environmental composition without changing authority

- [ ] 5. M5.5 — Encounter and traversal tuning
  - depends: 4
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - outcome: tune encounter pressure, spacing, pursuit compatibility, and traversal pacing

- [ ] 6. M5.6 — Full M5 playthrough and verification
  - depends: 5
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - outcome: production-build playthrough and M5 acceptance evidence

## Parallel groups

- none — world, save, placement, and runtime integration are sequential authority work

## Decisions

- 2026-08-10 | M4 Core RPG Loop is Product Owner accepted/closed; initialize M5 Connected Level | Explicit Product Owner authorization
- 2026-08-10 | Save world progression through SaveFileV2 with explicit V1 migration | V1 shape is immutable; opened shortcut is a new stable fact
- 2026-08-10 | Checkpoint rest/death respawn recreate all connected-level enemies, preserve opened shortcuts and loot-once memory, and never grant Echoes during reset | Keeps traversal progress and rewards deterministic across recovery cycles
- 2026-08-10 | Shape the graybox around direct pursuit and local steering: open encounter rooms, sparse blockers, and no route that requires navmesh | Respects the accepted M3 navigation boundary

## Escalation

- Any failed internal gate or HIGH-risk authority conflict stops the batch before the next step.
- Same error three times: write a stuck report under the active task and stop.
