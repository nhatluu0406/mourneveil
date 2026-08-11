# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m9-combat-depth

## Status

ACTIVE — M9 macro-batch 3 PASS. Enemy telegraph + punish-window readability is complete; M9 is not closed or tagged.

## Prior

- Macro-batch 1: guard impact / temporary guard break.
- Macro-batch 2: heavy-hit reaction interrupt (`a6ac421`).
- M8 remains accepted at `v0.8.0-production-asset-pipeline` → `244aab1`.

## Timing contract (authoritative)

| Role | startup | active | recovery |
|------|---------|--------|----------|
| Before | 18 / 5 / 18 | 42 / 8 / 36 |
| After | skirmisher **20 / 10 / 24** | brute **48 / 12 / 48** |

Simulation phases remain authoritative. Presentation derives from `action.phase` only. Punish window = recovery (no new state); recovery blocks reattack.

## Presentation

- Stronger procedural wind-up / swing / open-recover poses (role animation tuning).
- Phase projection: telegraph ring (startup), recovery ring (recovery), emissive accents, `phaseAccent`.
- DEV contact sphere unchanged.

## Interrupt / defense

- MB2 interrupt rules unchanged; startup interrupt now deterministically proven in `gate:m9-telegraph-readability`.
- Active non-interrupt remains unit-covered (player heavy startup 18 cannot connect inside skirmisher active 10).
- Guard / guard-break / dodge / mistimed damage regressions PASS.

## Runtime evidence

- `npm run gate:m9-telegraph-readability` PASS (port 4195 reusable; screenshots under `tmp-m9-telegraph-readability/`).
- Observed: skirmisher/brute phase frames; punish light in recovery; startup+recovery heavy interrupts; brute meter→reaction; guard/dodge/mistimed defense; no page errors.
- `gate:m9-hit-reaction` / `gate:m9-guard-depth` / `gate:lifecycle` PASS.

## Verification

- Focused telegraph/presentation/hit-reaction/guard/animation suites PASS.
- `npm run lint` / `typecheck` / `test` (71 files / 308 tests; Node heap flake possible under low memory) / `build` / `assets:verify` / `verify` PASS.
- `git diff --check`, LeanLoop doctor `--strict`, sync `--check` PASS.

## Debt

- No debt added. Placeholder procedural art remains roadmap scope, not a new deferred defect.

## Next

Recommended M9 macro-batch 4 for **Cursor**: player attack commitment/readability or contact/hit feedback tuning — contained presentation/timing, no new authority.

Recommend **Codex** only if Product Owner wants a shared stun/poise authority or animation-driven contact (rejected for this batch).
