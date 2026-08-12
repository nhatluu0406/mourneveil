# Current State

- Updated: 2026-08-12
- Accepted release: **`v0.9.0-combat-depth`** (M9)
- Active task: `m10-visual-production-identity`
- Status: **M10 ACTIVE — macro-batch 1 hero screenshot pass is green and awaiting Product Owner visual review**; M9 remains Product Owner accepted/closed.

## What exists

- Connected-level RPG loop + presentation foundation + M7/M8 animation/assets
- M9 combat depth: guard impact/break, enemy interrupt, telegraph/punish, player attack commitment, hit confirm
- M10 hero slice in progress: Veilbound Warden/Oathblade, veil-riven skirmisher, secondary brute pass, ossuary refuge kit, lighting/material/VFX/HUD cohesion
- Debug contact volumes are opt-in (`?debugContacts=1`); normal play uses authored veil-impact cues
- Gate-owned `tmp-m*` cleanup (`KEEP_ARTIFACTS=1` opt-in keep)
- Measured 1440×900 hero baseline and production visual ceilings; DPR capped at 1.5

## Highest-value limitations

- Areas beyond the checkpoint/early-combat hero composition still need M10 art production
- No posture/poise/knockback by design
- Bundle size advisory (D-004); GPU VRAM not exposed by browser tooling

## Next executable work

Review M10 macro-batch 1 visual evidence, then continue the highest-impact remaining M10 art pass; do not start M11 or tag M10.
