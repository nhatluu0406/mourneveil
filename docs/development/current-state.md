# Current State

- Updated: 2026-08-15
- Accepted: **M14 Itemization & Loot Depth** → `v0.14.0-itemization-loot-depth`
- Active: **M15 Presentation, Motion & Scene Readability** — MB4 ready for Product Owner visual review

## Status

M14 is closed. M15 MB4 presents Rite I as one architectural complex, adds articulated in-place player/enemy locomotion, resets landmark scale and physicality, and reduces normal-route render cost. Gameplay topology and authority are unchanged. M15 is not closed; do not start M16.

## Highest-value limitations

- D-002 local enemy navigation scope
- D-003 controller verification deferred
- D-004 main bundle size advisory
- Playwright-host FPS is host-noisy; use same-host A/B only. GPU timing extension was unavailable.
- MB4 object/mesh stretch targets remain narrowly missed (377/209 representative).
- `objects/remaining.ts` still holds untouched legacy object types.

## Next executable work

**PRODUCT OWNER:** review MB4 visual/motion evidence. If accepted, **CURSOR:** reproduce wall snag and tune movement feel without reopening art authority. Do not close M15 without separate authorization.
