# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Cursor
Task: m3-enemy-framework

## Status

**M3 CLOSED — Product Owner accepted on 2026-08-09 before M4 began.**

Closure note added from later canonical project history. The original session status and observations below remain historical.

## Historical session status

M3.1 through M3.6 complete on `main`.

Classification: **M3 READY FOR PRODUCT OWNER ACCEPTANCE**

## M3.1–M3.6 summary
- M3.1: immutable definitions + `EnemyRuntime` authority
- M3.2: first melee pursue/telegraph/attack/recovery/defeat
- M3.3: execution-facing, spacing hysteresis, local Rapier steering
- M3.3.1: liveness — do not gate enemy AI on player alive; soft-lock escapes
- M3.4: skirmisher + brute data packages; shared runtime; multi-instance isolation
- M3.5: `encounter.graybox.mixed` active/complete + role presentation
- M3.6: verification matrix, long-run tests, browser soaks A–D, milestone M3.6

## Two proven roles
- Skirmisher: faster, 70 HP, short commitment, tighter spacing, smaller body
- Brute: slower, 160 HP, long telegraph, heavier damage/contact, larger body

## Liveness contract
- Living enemy + living target: idle → pursue/spacing/attack → recovery → re-evaluate
- Dead target: finish committed action clocks, then idle; sim keeps running
- Reset player health (dev) or melee fixture restores engagement without permanent stall

## Steering limitation
- Local deterministic probes only for current convex graybox; no maze/navmesh guarantee

## Combat proof
- Outgoing: player light/heavy → enemy hurtbox, dedup, defeat
- Incoming: per-role damage, one hit/execution, dodge invuln, forward guard cone
- Facing: execution snapshot shared by telegraph/contact/guard

## Encounter proof
- Active while any encounter enemy alive; complete only when both defeated; fixture reset restores both

## Browser soak evidence (M3.6)
- A: extended reposition soak — both roles live; no console errors
- B: 3× player defeat → enemy idle while sim running → fixture reset restores
- C: kill skirmisher first (brute continues); kill both → complete; kill brute first (skirmisher continues)
- D: blocker/border roam progressed; no console errors
- Combat/UI: light damage to skirmisher; dodge/guard/focus-loss/reset controls; camera present; milestone M3.6

## Remaining non-blocking debt
- Bundle-size advisory
- Controller deferred
- No production VFX/assets/HUD/respawn

## Product Owner acceptance
Pending — do not grant acceptance in-agent.

## Next
M4 only after PO accepts M3. Do not start M4 in this session.
