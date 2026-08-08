# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Codex
Task: m2-combat-proof

## Status
M2.3 is complete. Active attack spheres query registered Rapier hurtboxes after fixed-step movement; simulation-owned execution IDs and target dedup produce typed hit events and deterministic training-target damage/health.

Classification: **M2.3 COMPLETE — M2.4 NEXT**

## Locked decisions
- Each accepted action start receives a monotonic simulation-owned execution ID; hard reset restarts that lifecycle.
- Rapier reports sphere/hurtbox candidates only. `CombatContactRuntime` validates the active action/window, sorts candidates, permits one hit per target/execution, emits the hit event, then applies damage.
- Light/heavy damage is immutable attack data: 20/35. The stationary target has 100 health, clamps at zero, rejects damage while defeated, and remains a fixture rather than an enemy framework.
- Fixed-step order is action phase advance → character movement/collision → current-transform contact query → hit eligibility/damage. Render projects target health/defeat only.

## Verification
- Focused combat/contact/Rapier: 5 files / 31 tests passed.
- M1 movement/collision regression: 4 files / 12 tests passed.
- Existing M2 action/input/runtime regression: 5 files / 28 tests passed.
- Full: lint/typecheck passed; 18 files / 73 tests; build and `npm run verify` passed (346 modules).
- Local Vite runtime returned HTTP 200 at `127.0.0.1:4173`; no controllable browser was available, so interactive hit/dedup/facing/death and visual/regression checks remain manual.
- Existing bundle-size advisory is unchanged and non-blocking.

## Not implemented
Enemy AI/attacks, player health, stamina, dodge, guard, knockback, stagger, combos, loot, controller combat input, production VFX/audio, or broader health/enemy frameworks.

## Next session starts with
M2.4 — Dodge and defensive mechanic. Preserve contact/damage contracts; do not start M2.5.
