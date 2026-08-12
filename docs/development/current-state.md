# Current State

- Updated: 2026-08-12
- Accepted: **M12 Vertical Slice Alpha** → `v0.12.0-vertical-slice-alpha`
- Prior: `v0.11.0-boss-vertical-slice` (M11), `v0.10.0-visual-production-identity` (M10)
- Active task: `m13-character-progression-build-identity` (Macro-batch 1 — progression foundation)

## Status

**M12 CLOSED.** Fresh-start-to-boss vertical slice accepted. Active work is M13 Character Progression & Build Identity — durable XP/level, Vitality/Resolve/Might allocation, equipment composition, save persistence. Do not start M14.

## What exists

- Full authored vertical-slice journey through boss defeat with rite-complete endpoint
- Vitality vs Ward charm tradeoff, acquisition feedback, inventory Guard comparison
- Camera/occlusion stability, production visual identity, combat depth
- Gate-owned `tmp-m*` cleanup (`KEEP_ARTIFACTS=1` opt-in keep)

## Highest-value limitations

- D-002 local enemy navigation scope
- D-003 controller verification deferred
- D-004 main bundle size advisory (~3.6 MB)

## Next executable work

M13 Macro-batch 1: progression foundation (stats resolver, XP/level, allocation, save V3, `gate:m13-progression`). Active skills deferred unless foundation stays small.
