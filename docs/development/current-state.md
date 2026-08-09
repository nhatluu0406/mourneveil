# Current State

- Updated: 2026-08-09
- Milestone: **M2 Combat Proof in progress — M2.5 complete**
- Active LeanLoop task: `m2-combat-proof`
- Status: attack aim, contact, and presentation now share one frozen execution-facing snapshot; PO directional miss and white-geometry issues addressed with browser proof.

## What exists

- Accepted attacks freeze semantic aim into `attackExecutionFacing` for presentation and contact
- Light/heavy graybox presentation with clearer forward-biased sweeps and presentation-only hit flash/recoil + tiny camera impulse
- Training-target facing marker removed; player facing marker recolored as an explicit debug chevron
- Canvas Reset-target isolation and border/input lifecycle recovery preserved from M2.4

## Known limitations

- No enemy AI/attacks, player health, stamina, parry, lock-on, combos, controller combat, or production VFX/animation
- Authoritative hit-stop was not added (presentation-only feedback preferred)
- Bundle-size advisory remains non-blocking

## Next executable work

M2.6 — Combat verification. Do not add features; produce the reproducible Combat Proof happy path and explicit M2 limitations.
