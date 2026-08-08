# Current State

- Updated: 2026-08-09
- Milestone: **M2 Combat Proof in progress — M2.4 complete**
- Active LeanLoop task: `m2-combat-proof`
- Status: mouse-world attack aim, canvas input ownership, stuck-input lifecycle recovery, dodge, and guard now extend the accepted M2.3 authority chain.

## What exists

- Light/heavy attacks snapshot click-projected world aim and retain M2.3 one-hit damage behavior
- Canvas-only pointer combat excludes diagnostic UI and clears held input on unreliable pointer/focus lifecycle
- Collision-resolved 2/8/8-step dodge with sampled direction and active-only invulnerability
- Idle-only held-RMB guard with deterministic 35% locomotion scale
- Development aim/input/defense diagnostics and primitive guard projection

## Known limitations

- Browser control was unavailable; multi-direction aiming, UI isolation, border replay, dodge/guard feel, resize, and console checks remain manual
- No incoming enemy attacks, stamina, parry, player health, controller combat input, or production defense presentation
- Physical controller M1 play-pass and bundle-size advisory remain deferred

## Next executable work

M2.5 — Combat presentation and feel (Cursor). Preserve simulation/input/contact authority; include the pending M2.4 browser replay before presentation acceptance.
