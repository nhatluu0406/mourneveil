# Current State

- Updated: 2026-08-09
- Milestone: **M2 Combat Proof in progress — M2.2 complete**
- Active LeanLoop task: `m2-combat-proof`
- Status: M1 accepted and closed. Authoritative light/heavy player attacks now have production mouse requests, fixed-step phases, committed facing/movement, and graybox projection.

## What exists

- Edge-triggered LMB light attack and Shift+LMB heavy attack semantic requests
- Immutable 8/4/14-step light and 18/6/30-step heavy action definitions
- Last-movement facing, phase-driven locomotion constraint, primitive weapon sweep, and active-window contact-sphere visualization
- Facing-relative contact-shape data ready for M2.3 queries; no hit or damage resolution exists

## Known limitations

- No hit resolution, damage, enemies, health, stamina, combos, controller combat input, dodge, or guard
- Browser interaction was unavailable for this session; Vite startup was confirmed, but mouse/visual/runtime regression checks remain manual
- Physical controller M1 play-pass and bundle-size advisory remain deferred

## Next executable work

M2.3 — Contact and damage proof. Consume the active facing-relative contact shape; do not broaden into an enemy framework.
