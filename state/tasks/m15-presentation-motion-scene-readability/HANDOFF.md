# HANDOFF

Updated: 2026-08-14 by Cursor
Task: m15-presentation-motion-scene-readability

## Status

ACTIVE — MB1 complete locally. Motion/quality gates green. Not M15-closed.

## Locked decisions

- Fixed 60 Hz simulation. Rapier on authoritative transforms. Camera follows interpolated player presentation.
- Two rAF loops retained; interpolation is the smoothness layer.
- Default camera: closer-tactical. Baseline A/B: `?m15Baseline=1`.
- DEV FPS HUD: `?perfHud=1` or F3. Production hidden.
- Zone mount: current + neighbors + perimeter.

## Same-host before → after (Playwright 1440×900, Node 24)

- Player screen height: 115.3 → 148.7 px (**+29%**)
- lookAt step: 1.77 → 0.97 m
- screen X variance: 2750 → 1227
- draw calls: 227 → 207; objects: 541 → 437; meshes: 323 → 266
- Host FPS under Playwright ~7–10; not used as a universal CI law

Evidence: `state/tasks/m15-presentation-motion-scene-readability/reports/mb1-comparison.json`

## Art-only for Codex

- Arch/pole density around the hero still competes after closer framing
- Processional markers are tall high-contrast silhouettes
- Some benches/props read weakly grounded in dark pools
- Material contrast and background mass composition

## Next session starts with

1. MB2: further transition polish and any remaining technical clutter from Product Owner review. Do not start M16.
