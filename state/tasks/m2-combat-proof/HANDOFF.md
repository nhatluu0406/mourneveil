# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Codex
Task: m2-combat-proof

## Status
M2.4 implementation and automated verification are complete. Mouse-world aim, input ownership/lifecycle recovery, dodge, and guard preserve M2.3 contact/damage authority.

Classification: **M2.4 COMPLETE — M2.5 NEXT**

## Locked decisions
- Attacks project canvas pointer coordinates to the ground plane, convert the hit point to semantic aim, and snapshot it only after action acceptance.
- Combat pointer listeners belong to the canvas. UI never enters that path; pointer capture plus cancel/leave/outside-release, blur, pagehide, and hidden-tab lifecycle clear held combat input and reset keyboard state when ownership becomes unreliable.
- The border/action stall was stale keyboard state: a missed forward key-up plus pressed reverse direction normalized to neutral. Combat was idle, suppression was false, velocity/requested/corrected horizontal movement were zero, and grounding remained true. Shared surface lifecycle reset clears the stale pair; no physics rule changed.
- Dodge: Space press edge; 2 startup / 8 active / 8 recovery steps; direction sampled from movement or facing fallback; 8 m/s active displacement through the existing Rapier resolver; active-only invulnerability; no voluntary cancel.
- Guard: held canvas RMB, idle-only entry, release-to-idle on the next fixed step, 35% movement scale. Attacks/dodge cannot start while guard is held; guard cannot enter during committed actions.

## Verification
- Focused input/defense/contact/Rapier sets passed; full suite: 22 files / 84 tests.
- Lint, typecheck, build, `npm run verify`, diff check, strict doctor, and sync check passed.
- Vite served HTTP 200 at `127.0.0.1:4173`. No controllable browser was available, so the requested interactive replay and console/resize observations remain manual.
- Existing bundle-size advisory remains non-blocking.

## Not implemented
Enemy attacks/AI, player health, stamina, parry, knockback, combos/buffering, lock-on, controller combat input, production animation/VFX/audio, or M2.5 presentation tuning.

## Next session starts with
M2.5 — Combat presentation and feel (Cursor). First replay the pending M2.4 browser matrix; do not change simulation authority to tune presentation.
