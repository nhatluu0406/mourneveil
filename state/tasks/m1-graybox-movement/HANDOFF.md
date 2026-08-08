# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Codex
Task: m1-graybox-movement

## Status
M1.2.1 complete after M1.3: deterministic raw-Rapier reproduction proved the capsule retained the configured 2 cm blocker separation; the visible clipping was the facing marker extending beyond the capsule. The marker now fits inside shared capsule dimensions, with real-Rapier and visual-geometry regressions. Motor, collision policy, simulation timing, and M1.3 camera behavior were not changed.

## Locked decisions
- Camera is presentation-only: `FollowCameraRig` damps a look target then places the camera at fixed offset `(8.5, 10.5, 8.5)`; orientation is not player-controlled
- `FOLLOW_DAMPING = 12` (restored to first Playwright-verified value after lag/snappiness tuning)
- No render→sim feedback; no mesh interpolation added
- Foundation diagnostic React updates throttled (~every 6 frames); simulation and camera still advance every animation frame
- Milestone label `M1.3`
- Capsule contract: radius `0.35`, half-height `0.45` (1.60 m total); center blocker visual/collider size `1.5³`
- M1.4 is unblocked; include the pending browser replay in its M1 verification

## Open defects / pending checks
1. **Sustained WASD feel lag (MEDIUM, deferred by PO):** Movement still feels laggy while holding WASD; PO will address later.
2. **M1.2.1 browser replay pending:** No controllable browser was available. Recheck straight, diagonal, repeated, and corner blocker contact; grounding; focus loss; unchanged camera; and console health during M1.4 verification.

## Verification
- Focused: `src/render/followCamera.test.ts` + foundation diagnostic milestone test — pass
- `npm run lint`, `typecheck`, `test` (21), `build`, `verify` — pass (chunk-size advisory remains)
- Playwright smoke: WASD moves player; camera `high-oblique-follow` tracks; resize retains canvas/panel; no console/page errors; no document overflow
- PO image evidence triggered M1.2.1 investigation of apparent center-cube clipping
- M1.2.1 focused: 4 files / 9 tests pass, including raw Rapier repeated center-blocker contact and visual marker containment
- M1.2.1 full: lint, typecheck, 9 test files / 23 tests, build, verify pass; existing chunk advisory remains
- M1.2.1 local server: HTTP 200; browser discovery returned no available browser, so gameplay/visual replay is explicitly pending
- `doctor --strict` / `sync.py --check` — OK at implementation time

## Next session starts with
1. Read STACK.md, PLAN.md, and this HANDOFF
2. Execute **M1.4** (controller input + M1 verification), including the pending M1.2.1 browser replay. Do not start combat.
