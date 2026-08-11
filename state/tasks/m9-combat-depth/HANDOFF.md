# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m9-combat-depth

## Status

ACTIVE — M9 macro-batch 4 PASS. Player attack commitment + outgoing hit confirmation complete. M9 is **READY FOR PRODUCT OWNER ACCEPTANCE** (not closed/tagged).

## Prior

- MB1: guard impact / temporary guard break
- MB2: heavy-hit reaction interrupt
- MB3: enemy telegraph + punish-window readability (`eb40ac8`)
- M8 remains accepted at `v0.8.0-production-asset-pipeline` → `244aab1`

## Player attack contract (authoritative)

| Attack | startup | active | recovery | notes |
|--------|---------|--------|----------|-------|
| Light | **10** | **5** | **16** | was 8/4/14 |
| Heavy | **18** | **8** | **38** | was 18/6/30; startup kept ≤ skirmisher 20 for interrupt trading; weight in recovery |

- Startup/active: locomotion fully constrained; facing freeze unchanged.
- Recovery: movement scale **0.35**.
- Simulation phases own contact; presentation projects only.

## Hit confirmation hierarchy

miss none < light damaged < heavy damaged < interrupt (`hitReaction`) < defeat

- Camera impulse + player weapon/torso emissive + brief HUD line from authoritative `contact.lastHit`.
- Per-execution dedup; miss produces no impulse/confirm cue.
- Guard / guard-break / enemy reaction presentation remain distinct (unchanged systems).

## Runtime evidence

- `npm run gate:m9-player-combat` PASS (port 4195; screenshots `tmp-m9-player-combat/`).
- Observed: light/heavy phase frames; miss no confirm; light hit once; mash blocked; skirmisher interrupt; brute meter→second interrupt; defeat; guard + dodge regressions.
- Also PASS: `gate:m9-guard-depth`, `gate:m9-hit-reaction`, `gate:m9-telegraph-readability`, `gate:lifecycle`.

## Verification

- Focused attack/commitment/feedback/defense/hit-reaction suites PASS.
- `npm run lint` / `typecheck` / `test` (73 files / 319 tests) / `build` / `assets:verify` / `verify` PASS.
- `git diff --check` (CRLF warnings only), LeanLoop doctor `--strict`, sync `--check` PASS.

## Debt

- No new debt. Procedural player art limits remain roadmap/content scope (D-001 already covers weapon clipping).

## M9 readiness

Goal satisfied: deterministic melee deepened (guard depth, interrupt, enemy telegraph, player commitment, hit confirm) without new authority systems.

**READY FOR PRODUCT OWNER ACCEPTANCE** — do not self-close/tag; do not start M10.

## Next

Product Owner acceptance / optional close+tag of M9. If rejected, one highest-value blocker only (not a wishlist).
