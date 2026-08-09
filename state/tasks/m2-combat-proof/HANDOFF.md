# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Cursor
Task: m2-combat-proof

## Status
M2.5 implementation and verification complete. PO aim/contact correctness gate passed in a real Chromium browser; graybox presentation/hit feedback kept presentation-only.

Classification: **M2.5 COMPLETE — M2.6 NEXT**

## Locked decisions
- Accepted attacks own frozen `attackExecutionFacing`; presentation orientation and contact-shape orientation both consume that snapshot only.
- Screen-to-world aim uses canvas bounds → NDC → current gameplay camera ray → y=0 plane; `camera.updateMatrixWorld(true)` before projection.
- Contact sphere sizes unchanged (light 0.82/0.52, heavy 0.98/0.68); rear extent stays forward of the player (~0.30).
- White primitives: player cream facing marker → teal debug chevron; training-target orientation box removed; weapon remains distinct; contact wireframe is active-window debug only.
- Hit feedback is presentation-only (target flash/recoil + tiny camera impulse). No authoritative hit-stop / clock redesign.

## Root causes addressed
- Large weapon yaw sweep made attacks look off-axis while contact followed facing; clicks during an in-flight commit were rejected so facing appeared “stuck.”
- Misleading near-white facing markers on player and target read as gameplay props.

## Verification
- Focused aim/contact + full suite: 23 files / 98 tests.
- `npm run verify`, `git diff --check`, strict doctor, sync check passed.
- Playwright Chromium browser matrix: cardinals/diag execution facing match clicks; toward-target hit (100→80); away and perpendicular miss (100); Reset isolation; border move recovery; dodge/guard; no uncaught console errors.

## Not implemented
Enemy AI/attacks, player health, stamina, parry, lock-on, combos/buffering, controller combat, production animation/VFX/audio, authoritative hit-stop, M2.6 fixture pack.

## Next session starts with
M2.6 — Combat verification. Preserve M2.5 authority; do not start new combat features.
