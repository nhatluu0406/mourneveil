# HANDOFF

Updated: 2026-08-10 by Cursor
Task: m5-connected-level

## Status

M5.1–M5.6 PASS in-repo. **Product Owner acceptance pending.** Do not tag or start M6 until PO accepts.

## M5.3.1

- Through-wall root cause: melee pipeline accepted Rapier hurtbox overlap alone; thin connected-level walls allowed contact spheres to overlap through solids.
- Fix: `createRapierCombatOcclusionQuery` + contact resolve requires overlap AND solid fixed-world ray clear (`ONLY_FIXED | EXCLUDE_SENSORS`).
- Far-damage exact root cause: all encounters simulated from session start; browser evidence showed `enemy.skirmisher.introduction` left Outer Watch, closed to ~1.05m at the refuge, and applied repeated 10 dmg hits (health 100→0). Not phantom range damage.
- Fix: zone activation + egress leash (`EncounterActivationRuntime`); inactive enemies neither perceive nor attack.
- Navigation root cause: local 45° probes deadlocked against long dividers/blockers.
- Fix: immutable authored route anchors from zone connections + local detours; mutable per-enemy route state in `GameRuntime`.
- Browser: `scripts/browser/gate-m531-correctness.mjs` PASS.

## M5.4

- Graybox landmarks, taller checkpoint beacon, open/closed gate markers, removed physics-grid look.
- Collapsible compact development panel; inventory uses `displayName`; no horizontal overflow.
- Training target removed from normal M5 contact targets (fixture reset retained in expanded debug panel).
- Milestone source: `developmentDiagnostic.ts` (`DEVELOPMENT_MILESTONE` + `DEVELOPMENT_MILESTONE_STEP`).
- Browser: `gate-m54-readability.mjs` PASS.

## M5.5

- Retuned intro/mixed/pressure stand-offs; egress margin 0.55.
- Browser soak: `gate-m55-tuning.mjs` PASS; M5.3.1 still PASS.

## M5.6

- Fresh-run playthrough: arrival → fights → checkpoint → loot/equip → shortcut → death/respawn → echo recover → pressure → final gate/arena → reload → 3 death cycles → combat/UI regression.
- Browser: `gate-m56-playthrough.mjs` PASS.

## Remaining navigation limitations

- Authored anchors/detours only — not a navmesh; concave/unauthored pockets can still require additional nodes.
- Enemies do not pursue across zone egress (by policy).

## Commits

- `d91c79e` fix(world): enforce combat occlusion and enemy navigation
- `60a0bb3` feat(world): improve connected level readability
- `76e84e4` feat(encounter): tune connected level encounters
- (pending) test(world): complete M5 connected level verification

## Next action

Product Owner runtime acceptance. After accept + push, PO creates tag `v0.5.0-connected-level`. Do not start M6 in this task.
