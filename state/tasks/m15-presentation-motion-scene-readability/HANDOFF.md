# HANDOFF

Updated: 2026-08-14 by Cursor
Task: m15-presentation-motion-scene-readability

## Status

ACTIVE — MB2 complete locally. Ready for Product Owner visual review. Not M15-closed. Do not start M16. Do not assign Codex until PO accepts the room shells.

## Locked decisions (keep MB1)

- Fixed 60 Hz simulation. Rapier on authoritative transforms. Camera follows interpolated player presentation.
- Two rAF loops retained. Default camera: closer-tactical. DEV FPS HUD: `?perfHud=1` or F3.
- Zone mount: current + neighbors + perimeter.

## Locked decisions (MB2)

- Static architecture stays opaque. Allowed fade IDs: `gate.shortcut`, `gate.final`.
- Camera-near edges (east/+X, north/+Z) are low wall.bay parapets. Far edges may be tall. No roof.
- ADR-0003: rooms → placements → ADR-0002 registry. Gameplay topology unchanged.
- MAGICAL_VFX: 4 wisps. One hanging bell with `supportInstanceId`. No ordinary floaters.
- Locomotion gait is presentation-only and distance-driven. Teleports reset gait.

## Same-host metrics (Playwright 1440×900)

MB1 after → MB2 after (motion gate):
- draw calls: 207 → 164–221 (host-noisy; no ceiling raise)
- scene objects: 437 → 378
- placements: 409 → 141
- meshes: 266 → ~226–236
- lights (culled): 9 → 7; authored actual-light budget still ≤12
- player screen height: 148.7 px (held)
- lookAt max step: 0.97 → 0.42 m
- idle gait delta: 0

Stretch ≤350 objects / ≤230 meshes not hit; improved vs MB1 and below previous live route.

## Art-only for Codex (after PO accepts shells)

- Surface richness on rectangular floors/walls
- Prop grouping and material contrast
- Arch/doorway production language on far openings
- Background mass composition
- Stronger practical-light fixtures (layout is stable)

## Next session starts with

1. Product Owner screenshot/video review of MB2 rooms + walk.
2. Only after structural acceptance: M15 MB3 Codex art on stable shells.
