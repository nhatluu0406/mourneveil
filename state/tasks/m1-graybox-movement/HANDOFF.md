# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-08 by Codex
Task: m1-graybox-movement

## Status
M1.2 is implemented. The fixed-step player runtime consumes M1.1 intent, advances a pure acceleration/deceleration motor, and delegates displacement clipping plus grounding to a Rapier kinematic character controller. One rendered capsule, perimeter walls, and the existing center blocker form the deterministic graybox fixture. Automated gates pass; live interaction remains unverified because browser discovery returned no available browser.

## Locked decisions
- Simulation timing remains the M1.1 bounded 60 Hz policy
- Player position, velocity, grounded state, and sampled intent live in `PlayerRuntime`/`PlayerMotorState`, not React or Three.js
- The motor proposes displacement; Rapier resolves it using a kinematic capsule, 2 cm contact offset, 10 cm ground snap, sliding, and a 45 degree walkable-slope limit
- M1 movement tuning is 4 m/s maximum speed, 18 m/s² acceleration, 24 m/s² deceleration, 24 m/s² gravity, and 30 m/s terminal fall speed; values remain eligible for later tuning
- No interpolation, camera follow, jumping, sprinting, animation, or combat was added

## Verification
- `npm run test -- src/game/character src/physics`: 2 files, 7 tests passed
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run verify`: passed; full suite is 6 files / 18 tests
- Dev endpoint `http://127.0.0.1:4173/`: HTTP 200
- Browser checks unverified: visible player/movement/stop, diagonal feel, wall/corner collision, floor support, focus-loss recovery, resize, and console
- Existing Vite chunk-size advisory remains deferred

## Next session starts with
1. Read STACK.md, PLAN.md, and this HANDOFF; inspect Git state
2. Execute PLAN step 3 (M1.3 Camera and runtime tuning) with Cursor; do not start M1.4 or combat
