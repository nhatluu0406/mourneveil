# PLAN: M9 Combat Depth — Guard Impact / Guard Break
<!-- Live M9 graph only. -->

Input: Product Owner M9 macro-batch 1 | Stack: `STACK.md` | Task: `m9-combat-depth`

## Goal

Add one deterministic guard-impact and temporary guard-break vertical slice without adding stamina, changing hit authority, or weakening M8/M7 contracts.

## Non-goals

- Stamina/posture/parry/perfect guard, combos, lock-on, new weapons/enemies, boss, pathfinding, production art, M10.

## Steps

- [x] 0. Close accepted M8 and establish M9 combat truth
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: M8 closure docs/tag; read-only player/enemy combat audit
  - verifier: Node 22 lifecycle/full verify green; annotated M8 tag peels to verified closure commit; player/enemy authority flow recorded in M9 HANDOFF
- [x] 1. Add authoritative guard-impact runtime contract
  - depends: 0
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/combat/playerDefense.ts`, narrow GameRuntime/contact integration, focused tests
  - verifier: frontal/rear/unguarded, impact/break/recovery/input rejection/dedup/death/transient-reset tests
- [x] 2. Project minimal guard feedback
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: typed animation projection, procedural player pose/material marker, HUD diagnostics, focused presentation tests
  - verifier: guarded impact and broken state are distinguishable; presentation does not mutate gameplay
- [x] 3. Add deterministic M9 runtime gate
  - depends: 1, 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: development gate adapter and one owned Playwright script
  - verifier: frontal block → repeated pressure → break → damage → recovery → guard again; rear bypass; page errors zero; owned cleanup/port reuse
- [x] 4. Verify and hand off M9 macro-batch 1
  - depends: 1, 2, 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: PLAN, M9 HANDOFF/CHECKPOINT, current-state/roadmap/REPOMAP, debt only if a real deferred limitation is introduced
  - verifier: focused combat/navigation/M7/asset/lifecycle tests; lint/typecheck/test/build/verify; browser gate; diff/doctor/sync/git guard; final process audit

## Locked contract

- Guard remains an authoritative fixed-step player-defense state. A guarded contact is deduplicated before impact is applied.
- Guard impact is transient and not saved. Threshold break is fixed-duration, rejects guard, clears automatically, and cannot become permanent.
- Existing enemy attack definitions supply the impact weight; HP damage/contact timing remain unchanged.
- Animation, HUD, render weapon, and physics contacts only project or report the simulation outcome.

## Escalation

- Stop before later steps if guard depth requires a parallel stamina/stat system or animation-driven combat transitions.
- Same failure three times: persist a stuck report and stop.
