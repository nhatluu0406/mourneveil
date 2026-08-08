# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Codex
Task: m2-combat-proof

## Status
M2.2 is complete: production mouse edges submit semantic light/heavy requests; the player runtime owns fixed-step action progression, persistent movement-derived facing, locomotion commitment, and active facing-relative contact spheres. Presentation projects that state with a primitive weapon sweep and active-window sphere; it does not resolve hits.

Classification: **M2.2 COMPLETE — M2.3 NEXT**

## Locked decisions
- LMB creates one light request on its press edge; Shift+LMB creates heavy; held input does not retrigger. Blur, hidden-tab, reset, and disconnect clear pending/held mouse state. Controller combat remains deferred.
- Light timing is 8 startup / 4 active / 14 recovery steps; heavy is 18 / 6 / 30. Both use zero cooldown and no resource cost.
- Facing follows normalized meaningful movement and persists through neutral input. Startup, active, and recovery constrain movement by supplying neutral locomotion intent, preserving facing; no lunge exists.
- Each action owns one sphere shape (`forwardOffset`, `radius`, matching action/window IDs). World center derives from authoritative player position and facing; it is exposed only in the active contact window.
- The old debug action/button was removed. Weapon sweep, phase color, facing rotation, and contact wire sphere are presentation-only projections.
- Gameplay interruption delegates to `requestInterruption`; the hard reset API remains separate and is not used for gameplay.

## Verification
- Focused attack/input/character/diagnostic tests: 6 files / 24 tests passed.
- M1 regression subset: 4 files / 12 tests passed.
- Full: lint and typecheck passed; full suite 15 files / 57 tests passed; build and `npm run verify` passed (341 modules).
- `git diff --check`, strict LeanLoop doctor, and LeanLoop sync check passed.
- Local Vite runtime returned HTTP 200 at `127.0.0.1:4173`.
- No controllable browser was available, so mouse mapping, visual phase distinction, facing/contact projection, movement commitment, focus reset, and M1 camera/collision regression remain manual.
- Existing Vite chunk-size advisory is unchanged and non-blocking.

## Not implemented
Hit queries/resolution, damage, enemies, health, stamina, combos/buffering, controller combat input, dodge, guard, lock-on, production animation, VFX, and audio.

## Next session starts with
M2.3 — Contact and damage proof. Consume `activeContactShape`; do not start an enemy framework or let physics contacts decide damage directly.
