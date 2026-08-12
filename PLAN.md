# PLAN: M10 Final Stabilization — Camera Jitter + Foreground Occlusion
<!-- Live M10 graph only. -->

Input: Product Owner blocking regressions (occlusion + camera jitter) | Stack: `STACK.md`
Task slug: `m10-visual-production-identity`

## Goal

Fix camera jitter and foreground wall occlusion so the player/playable space stay readable; verify green; report M10 acceptance readiness. No new M10 art content.

## Non-goals

- M11 implementation; M10 tag/push unless PO acceptance handled at closure
- New environment kit, actors, textures, HUD redesign, VFX system
- Cinematic/spline/lock-on camera frameworks
- Making all walls transparent or changing gameplay collision

## Steps

- [x] 1. Reproduce both bugs with diagnostics; identify root causes (camera + occluders)
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: PLAN, diagnostic gate scripts, HANDOFF notes
  - verifier: focused browser repro capturing camera/occluder state
- [x] 2. Fix camera smoothing contract (stable look-ahead, frame-rate-independent damping)
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/render/followCamera*`, FollowCameraRig, camera tests/gate
  - verifier: `npm run test -- src/render/followCamera.test.ts && npm run gate:m10-camera-stability`
- [x] 3. Fix foreground occlusion (stable-ID fade; resolve D-005 duplicate walls if causal)
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: ConnectedLevelVisual, occlusion materials, world object flags, silhouette placements
  - verifier: `npm run test -- src/render/cameraOcclusion.test.ts src/render/world && npm run gate:m10-occlusion-readability`
- [x] 4. Full regression + M10 closure readiness report (no tag without PO)
  - depends: 2, 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: gates, HANDOFF/current-state/DEBT/PLAN/roadmap note
  - verifier: `npm run verify && npm run gate:m8-stabilization && npm run gate:m9-player-combat && npm run gate:m9-guard-depth && npm run gate:m9-hit-reaction && npm run gate:m9-telegraph-readability && npm run gate:m9-perf-baseline && npm run gate:m10-perf-baseline && npm run gate:m10-hero-visual && npm run gate:m10-ui-compact && npm run gate:lifecycle`

## Decisions

- One presentation system owns camera follow transform.
- Occlusion fade is presentation-only on eligible solid architecture IDs.
- No new M10 art content.

## Escalation

- Same failure 3× → stuck report and escalate.
