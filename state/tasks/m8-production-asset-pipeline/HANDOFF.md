# HANDOFF

Updated: 2026-08-12 by Codex
Task: m8-production-asset-pipeline

## Status

**ACTIVE — macro-batch 4 corrections complete.** M8 remains open and untagged; M9 not started.

## Repository truth

- Began clean on `main` at `91152ab`, equal to `origin/main`; `91152ab` ancestry verified.
- Annotated `v0.7.0-animation-foundation` peels to `c93f083`.
- No branch, push, history rewrite, or tag operation.

## Weapon correction

- Residual defect: the 0.95 m procedural blade could still visibly penetrate narrow pillars/walls despite render-only footprint retraction.
- Product Owner direction favored simplicity: blade is now a fixed 0.56 m placeholder at the existing grip/sweep origin. `playerWeaponWallConstraint.ts` and its tests were removed.
- Damage, action timing, execution facing, attack contact radius/offset, physics, and player movement were not changed. Runtime damage proof remained 70 → 50.
- Divider, perimeter, and narrow-column idle/locomotion/committed-attack screenshots show a proportionate weapon without the prior glaring long-blade penetration. Rare extreme-pose clipping is deferred to production character/weapon assets.

## Enemy navigation correction

- Root cause: shared pursuit had stateless per-step 45° collision steering; authored-route fallback triggered only after near-zero corrected motion. A collider could permit tiny/sliding motion indefinitely, so no stable side choice was retained.
- `connectedNavigation` now detects the first blocking authored XZ footprint expanded by enemy radius, scores deterministic two-corner routes, and stores selected positions in per-enemy navigation state.
- `GameRuntime` holds a local detour with a tight 0.18 m corner threshold, releases it when direct pursuit clears, and otherwise retains existing cross-zone authored routes. Rapier resolves every step; render geometry, attacks, damage, spacing, and enemy state transitions remain unchanged.
- Pure tests cover clear, centered, left/right-offset, deterministic selection, finite corners, and release. Real Rapier tests cover centered/offset/narrow-pillar routes reaching combat; existing defeat, collision, spacing, contact, guard/dodge, and M7 animation regressions pass.

## Runtime evidence

- Owned `gate:m8-stabilization` fixture: introduction skirmisher at `(-10.2, 3.1)`, `blocker.first-combat` centered at `(-8.25, 4.25)`, player at `(-7.2, 4.8)`.
- Enemy committed to a side, cleared the blocker, resumed pursuit, and reached ≤1.4 m in four 250 ms samples; screenshot confirms melee reacquisition and player health 90/100.
- Gate also proved checkpoint/respawn, compact weapon wall/pillar poses, procedural skirmisher, 70 → 50 player attack damage, no asset/page errors, and owned cleanup.

## M8 technical acceptance

- Already demonstrated: editable source → manifest/import validation → canonical `/assets` runtime reference → deterministic shrine load/use → skinned animated GLB proof fixture → actionable malformed/missing diagnostics → asset-verified production build.
- Proof GLB remains isolated; playable skirmisher remains the Product Owner-preferred procedural renderer.
- No additional proof asset is technically required. Remaining work is Product Owner/content acceptance of the current M8 slice and a decision whether any production candidate is required before closure.

## Verification

- Focused navigation/presentation/combat/M7 tests, real Rapier fixtures, `assets:verify`, full npm/LeanLoop gates, diff review, and owned Playwright runtime gate: PASS.
- In-app Browser discovery returned no available backend; repository-owned Playwright supplied runtime evidence.
- Existing Vite >500 kB chunk warning and local Node 24/npm 11 vs declared Node 22/npm 10 remain non-blocking environment notes.

## Next

Product Owner acceptance decision for M8. If accepted, close M8 under a separately authorized closure task; otherwise name one concrete content acceptance gap. Do not start M9 from this handoff.
