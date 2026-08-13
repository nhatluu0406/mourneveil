# PLAN: M15 Presentation, Motion & Scene Readability — Macro-batch 2
<!-- Live M15 graph only. -->

Input: Product Owner M15 MB2 room/locomotion/occlusion brief | Stack: `STACK.md`
Task slug: `m15-presentation-motion-scene-readability`
Agent: Cursor only

## Goal

Make the hero route read as camera-safe rectangular rooms with grounded architecture and distance-driven walk presentation. Keep MB1 interpolation, closer-tactical camera, telemetry, and zone mounting. Do not close or tag M15. Do not start M16. No Codex art.

## Non-goals

- New enemies, NPCs, quests, regions, or M16
- New production meshes/materials/VFX (Codex MB3 after PO structural acceptance)
- Generic architecture transparency / Vesperfall copy
- Variable-step gameplay; interpolating Rapier
- Complex IK; rewriting the two-loop clock

## Steps

- [x] 1. Room-first contract, floorplan, ADR-0003
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `docs/design/m15-dungeon-floorplan.md`, `docs/architecture/decisions/0003-room-first-dungeon-composition.md`, `src/render/world/ossuary/dungeonRooms.ts`, STACK/PLAN
  - verifier: focused room-bounds/connection tests
- [x] 2. Camera-safe shells + fade removal + grounding audit
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `roomShell.ts`, `roomDressing.ts`, `routePlacements.ts`, `definitions.ts`, `cameraOcclusion`/`ConnectedLevelVisual`, `placementAudit.ts`, occlusion gates
  - verifier: no ordinary `occlusionPolicy:'fade'`; placement audit has zero unsupported ordinary objects; `gate:m15-occlusion` + room tests
- [x] 3. Distance-driven locomotion presentation
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `src/render/animation/playerLocomotionPresentation.ts`, `playerProceduralPose.ts`, `PlayerVisual.tsx`, motion gate
  - verifier: idle/blocked gait delta ~0; distance-proportional phase; focused turn tests
- [x] 4. Route migration evidence, density, regressions, MB2 handoff
  - depends: 2, 3
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: gates, HANDOFF, current-state, package.json
  - verifier: M15 motion/quality/occlusion/room gates + M14/M13/M12/M10/lifecycle/assets + `npm run verify`

## Locked decisions (keep from MB1)

- Fixed 60 Hz simulation. Rapier on authoritative transforms. Camera follows interpolated player presentation.
- Two rAF loops retained. Default camera: closer-tactical. DEV FPS HUD: `?perfHud=1` or F3.
- Zone mount: current + neighbors + perimeter.
- Vesperfall is inspiration only.

## Locked decisions (MB2)

- STATIC ARCHITECTURE STAYS OPAQUE. Only `gate.shortcut` and `gate.final` may fade.
- Camera-near room edges (east/+X and north/+Z) use low parapets; far edges may be tall. No roof.
- Rooms are authored rectangles with openings; placements are generated from rooms then sparsely dressed. ADR-0002 registry stays underneath.
- Gameplay zone IDs, encounters, checkpoint, shortcut, and final gate stay; presentation coordinates may move to match rooms.
- MAGICAL_VFX (wisps) may float. Ordinary stone/bone/metal must ground or attach.
- Locomotion gait is presentation-only and distance-driven. No sim/root-motion authority change.

## Escalation

- Gameplay/save/loot authority change → stop.
- Same failure 3× → stuck report + stop.
