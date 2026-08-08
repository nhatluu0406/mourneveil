# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Cursor/Composer
Task: m1-graybox-movement

## Status
M1.3 complete: high-oblique follow camera, graybox readability, resize-safe shell, camera diagnostic line, focused camera math tests. Motor constants and kinematic-controller architecture were not changed. Product Owner confirmed camera/framing usable; sustained movement lag deferred; center-blocker capsule clipping is an open M1.2 collision defect (do not treat movement as collision-safe until fixed).

## Locked decisions
- Camera is presentation-only: `FollowCameraRig` damps a look target then places the camera at fixed offset `(8.5, 10.5, 8.5)`; orientation is not player-controlled
- `FOLLOW_DAMPING = 12` (restored to first Playwright-verified value after lag/snappiness tuning)
- No render→sim feedback; no mesh interpolation added
- Foundation diagnostic React updates throttled (~every 6 frames); simulation and camera still advance every animation frame
- Milestone label `M1.3`

## Open defects (do not ignore)
1. **Center-blocker clipping (HIGH, M1.2):** Player capsule embeds into the central 1.5³ cube; facing marker can poke through as a white/light rectangle. Repro: walk into the center blocker from the side. Suspected kinematic character controller / collider resolution vs fixed cuboid — investigate in `src/physics/PlayerPhysicsBody.tsx` + motor displacement path. Do not “fix” by camera-only work.
2. **Sustained WASD feel lag (MEDIUM, deferred by PO):** Movement still feels laggy while holding WASD; PO will address later. Not fixed in M1.3 beyond diagnostic throttle + damping restore.

## Verification
- Focused: `src/render/followCamera.test.ts` + foundation diagnostic milestone test — pass
- `npm run lint`, `typecheck`, `test` (21), `build`, `verify` — pass (chunk-size advisory remains)
- Playwright smoke: WASD moves player; camera `high-oblique-follow` tracks; resize retains canvas/panel; no console/page errors; no document overflow
- PO image evidence: capsule clipped into center cube
- `doctor --strict` / `sync.py --check` — OK at implementation time

## Next session starts with
1. Read STACK.md, PLAN.md, and this HANDOFF
2. Prefer fixing **center-blocker clipping** before trusting M1 collision, then continue **M1.4** (controller input + M1 verification) — or start M1.4 while keeping the clipping defect explicit. Do not start combat.
