# Current State

- Updated: 2026-08-12
- Accepted release: **`v0.8.0-production-asset-pipeline`** (M8)
- Active task: `m9-combat-depth`
- Status: **M9 READY FOR PRODUCT OWNER ACCEPTANCE — FINAL** (stabilization green; not closed/tagged).

## What exists

- Connected-level RPG loop + presentation foundation + M7/M8 animation/assets
- M9 combat depth: guard impact/break, enemy interrupt, telegraph/punish, player attack commitment, hit confirm
- Ground-safe mid-body contact volume cues (DEV/active)
- Gate-owned `tmp-m*` cleanup (`KEEP_ARTIFACTS=1` opt-in keep)
- Perf baseline gate with renderer sanity ceilings; DPR capped at 1.5

## Highest-value limitations

- Procedural placeholders outside M8 proof assets (D-001)
- No posture/poise/knockback by design
- Bundle size advisory (D-004); GPU VRAM not exposed by browser tooling

## Next executable work

Await Product Owner acceptance of M9. Do not start M10 or self-close/tag without authorization.
