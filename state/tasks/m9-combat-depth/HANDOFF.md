# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m9-combat-depth

## Status

ACTIVE — M9 macro-batch 2 PASS. Enemy hit-reaction / heavy-hit interrupt is complete; M9 is not closed or tagged.

## Prior

- Macro-batch 1: guard impact / temporary guard break (HEAD baseline `13fbb25`).
- M8 remains accepted at `v0.8.0-production-asset-pipeline` → `244aab1`.
- M7 tag `v0.7.0-animation-foundation` → `c93f083`.

## Recon

- Player already distinguished light vs heavy attacks; no new attack architecture added.
- Enemy states previously had no simulation hit-reaction; animation only flashed from contact tokens.
- Damage applied without interrupting chase/attack except on defeat.
- Skirmisher/brute share `EnemyRuntime` + role-authored constants.

## Interrupt contract

- Trigger: existing heavy attack `interruptImpact: 1`; light `0`.
- Skirmisher threshold `1`; brute threshold `2`.
- Interruptible: idle/pursue/spacing, attack startup, attack recovery.
- Non-interruptible: attack active (committed), defeated, already reacting, post-reaction immunity.
- Reaction: 20 fixed steps; cancel action; clear execution facing; zero velocity; resume pursue/idle.
- Anti-stunlock: same `executionId` blocked; no re-entry while reacting; 12-step immunity; meter quiet-reset 90 steps.
- Applied only after deduped `damaged` contact events in `GameRuntime`. Transient / unsaved.

## Presentation

- M7 `projectEnemyAnimation` prefers authoritative `hitReaction` state over brief contact flash.
- No new VFX, no production GLB, no art replacement.

## Runtime evidence

- `npm run gate:m9-hit-reaction` PASS (owned lifecycle, port 4195 reusable).
- Observed in-page: skirmisher heavy → hitReaction/movement stop → recover; brute resists first heavy (meter=1) then reacts on second; post-reaction combat/nav legal; no page errors.
- `npm run gate:m9-guard-depth` re-run PASS (guard regression).

## Verification

- Focused hit-reaction/guard/contact/enemy/animation/nav/respawn suites PASS.
- `npm run lint` / `typecheck` / `test` (70 files / 303 tests) / `build` / `assets:verify` PASS.
- `npm run gate:lifecycle` PASS.
- `git diff --check`, LeanLoop doctor `--strict`, sync `--check` PASS.

## Debt

- No debt added or resolved. Intentional non-goals (posture, light stuns, knockback) remain roadmap scope, not deferred defects.

## Next

Recommended M9 macro-batch 3 for **Cursor**: small readability/tuning of interrupt windows (e.g. ensure startup interrupts are reliably observable in mixed encounters) or one narrow recovery-feel constant pass — no new authority.

Recommend **Codex** only if Product Owner wants a new authority boundary (true poise meter, shared stun abstraction across player guard-break, or knockback physics).
