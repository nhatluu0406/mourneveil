# Current State

- Updated: 2026-08-09
- Milestone: **M2 Combat Proof in progress — M2.3 complete**
- Active LeanLoop task: `m2-combat-proof`
- Status: M1 accepted and closed. Authoritative light/heavy attacks now resolve Rapier hurtbox overlap into deduplicated hit events and deterministic training-target damage.

## What exists

- Edge-triggered LMB light attack and Shift+LMB heavy attack semantic requests
- Immutable 8/4/14-step light and 18/6/30-step heavy action definitions
- Last-movement facing, phase-driven locomotion constraint, primitive weapon sweep, and active-window contact-sphere visualization
- Simulation-owned attack execution IDs and one-hit-per-target-per-execution eligibility
- Stationary Rapier hurtbox target with clamped 100-point health; light deals 20 and heavy 35
- Development target health/hit diagnostics, reset control, and defeated projection

## Known limitations

- No enemy AI, player health, stamina, combos, controller combat input, dodge, guard, knockback, or production effects
- Browser interaction was unavailable for this session; Vite startup was confirmed, but mouse/visual/runtime regression checks remain manual
- Physical controller M1 play-pass and bundle-size advisory remain deferred

## Next executable work

M2.4 — Dodge and defensive mechanic. Preserve M2.3 contact/damage authority and do not introduce a broad stamina system.
