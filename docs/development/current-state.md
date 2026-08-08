# Current State

- Updated: 2026-08-09
- Milestone: **M2 Combat Proof in progress — M2.1 complete**
- Active LeanLoop task: `m2-combat-proof`
- Status: M1 accepted and closed. Authoritative combat-action contracts and fixed-step runtime exist; visible attacks are not implemented.

## What exists

- Immutable action definitions with integer startup, active, recovery, and cooldown durations
- One-action runtime with typed cancellation/interruption policies, resource-validation hook, and active-phase contact-window state
- Fixed-step integration through the existing player runtime
- Debug-only action trigger and diagnostic phase/contact projection

## Known limitations

- No production combat input, visible attacks, animation, hitboxes, damage, enemies, health, stamina, dodge, or guard
- Browser diagnostic interaction was unavailable for this session; HTTP runtime startup was confirmed only
- Physical controller M1 play-pass and bundle-size advisory remain deferred

## Next executable work

M2.2 — Player attack actions. Do not begin contact/damage proof until M2.2 is complete.
