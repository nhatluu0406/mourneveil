# HANDOFF

Updated: 2026-08-11 by Codex
Task: m7-animation-character-feel

## Status

**M7A COMPLETE — READY FOR CURSOR M7B.** M7.0–M7.4 PASS. M6 remains closed; M8 not started.

## Locked authority

- Gameplay fixed-step state drives typed presentation intent.
- Animation never advances combat, movement, invulnerability, contact, damage, or recovery.
- Gameplay transforms remain authoritative; procedural and future GLTF animation are in-place presentation backends.
- Player procedural pose is derived from the shared state and simulation step; render damping blends only local parts.
- Skirmisher and brute share the enemy projection/pose backend; immutable role presentation data supplies distinct cadence and commitment.
- Enemy presentation facing consumes the same accepted `attackExecutionFacing` snapshot as contact authority.

## Runtime verification

- In-app browser discovery returned no available browser instances; M7.2 browser observation is unverified.
- M7.4 browser playthrough is likewise unverified. No substitute browser backend was used.
- Automated gate: 60 focused integration/regression tests; full 61-file/250-test suite; lint, typecheck, build, verify, diff, doctor, and sync PASS.
- The first duplicated verify run exhausted the Windows Vitest worker pool after a separate 250-test PASS; isolated `npm run verify` then passed all gates.

## Integration policy

- Precedence is defeated > committed action > hit reaction > guard > locomotion > idle.
- Render damping changes local procedural parts only; collision, aim rays, world transforms, and contact shapes are unchanged.
- Respawn and save/load derive fresh idle presentation from reset authoritative state; animation state is never serialized.
- M8 may replace procedural renderers with in-place GLTF/AnimationMixer backends consuming the same `AnimationPresentationState`.
- Keyboard and mouse remain primary; controller is deferred.

## Next action

Cursor executes M7.5 motion/camera/browser refinement, then M7.6 acceptance. Do not start M8.
