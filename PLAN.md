# PLAN: M15 Presentation, Motion & Scene Readability — Macro-batch 1
<!-- Live M15 graph only. -->

Input: Product Owner M15 MB1 presentation brief | Stack: `STACK.md`
Task slug: `m15-presentation-motion-scene-readability`
Agent: Cursor only

## Goal

Make the existing playable-alpha route feel stable, readable, and smooth with measurable presentation quality. Establish before/after motion evidence. Do not expand content.

## Non-goals

- New enemies, NPCs, quests, regions, or M16
- Art-direction redesign, new meshes/materials/VFX (Codex)
- Copying Vesperfall assets, layouts, UI, or pixel targets
- Variable-step gameplay; interpolating Rapier/collision authority
- Huge simulation/render loop rewrite without evidence

## Steps

- [ ] 1. Frame/camera telemetry, DEV FPS HUD, motion + quality gates
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/debug/`, `src/ui/` perf HUD, `src/app/`, `scripts/browser/gate-m15-*.mjs`, `package.json`, focused tests
  - verifier: focused telemetry tests + `npm run gate:m15-motion-quality` + `npm run gate:m15-quality-audit`
- [ ] 2. Presentation interpolation + loop decision
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/game/core/`, `src/game/runtime/`, `src/physics/PlayerPhysicsBody.tsx`, `src/render/FollowCameraRig.tsx`, `STACK.md` presentation ownership
  - verifier: focused interpolation tests + historical `gate:m10-camera-stability`
- [ ] 3. Camera framing, dead-zone, impulse channel
  - depends: 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/render/followCamera.ts`, `FollowCameraRig.tsx`, `src/app/App.tsx` FOV, camera tests
  - verifier: focused camera tests + `gate:m10-camera-stability` + `gate:m10-occlusion-readability`
- [ ] 4. Technical clutter, floating placements, zone activation, occlusion corridor
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/render/world/`, `cameraOcclusion.ts`, `ConnectedLevelVisual.tsx`, placement tests
  - verifier: placement/occlusion tests + `gate:m15-quality-audit` (no draw-call regression vs same-host before)
- [ ] 5. Before/after evidence, full regressions, MB1 handoff
  - depends: 2, 3, 4
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: active HANDOFF/current-state/PLAN, M14/M13/M12/M10 gates, `npm run verify`
  - verifier: motion/quality gates + M14/M13/M12/M10/lifecycle/assets + `npm run verify` + LeanLoop checks

## Locked decisions

- Simulation stays fixed 60 Hz. Collision/Rapier stay on authoritative sim transforms.
- Camera follows the same interpolated player presentation the viewer sees.
- Two rAF loops stay unless evidence proves a single owner is safer.
- Cursor may fix technical placement/duplicates/culling; Codex owns artistic replacement.
- Vesperfall is inspiration only.

## Escalation

- Gameplay/save/loot authority change → stop.
- Same failure 3× → stuck report + stop.
