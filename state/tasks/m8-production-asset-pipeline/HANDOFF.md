# HANDOFF

Updated: 2026-08-12 by Codex
Task: m8-production-asset-pipeline

## Status

**ACTIVE — macro-batch 3 stabilization complete.** M8 remains open; not tagged; M9 not started.

## Repository truth

- Macro-batch 3 began from clean `main` at `ac0c385`, exactly equal to local/remote `origin/main`; requested M8/M7 commits are ancestors.
- Annotated `v0.7.0-animation-foundation` peels to `c93f083`; remote read confirmed `origin/main=ac0c385` and the annotated tag object.
- No push, branch, history, or tag changes.
- Initial process audit found Vite PID 52044 listening on 4173 with a Mourneveil-local command path; it was stopped and the port released. npm PID 61176 lacked sufficient project/parent evidence and was intentionally left alone. No unrelated process was touched.

## Established M8 asset contract (macro-batches 1–2)

- Source under `assets/source` → import/validation → committed `public/assets` → stable typed `/assets/...` references.
- Embedded glTF and preferred GLB; meters, Y-up, ground-centered; embedded/no external textures; explicit byte budgets and provenance/license.
- Render assets never own collision. Refuge shrine glTF uses a world-authored checkpoint proxy and distinct spawn/interaction/visual anchors.
- `enemy.skirmisher.proof` is a project-authored skinned GLB with semantic idle/locomotion/attack/hit/defeat clips and retained validation/mixer coverage.

## Weapon-wall correction

- Root cause: Rapier correctly stopped the 0.35 m player capsule, but the render-only 0.95 m blade extended beyond it; camera foreground fading could make the penetration more visible. Attack contact geometry/timing were separate and correct.
- `playerWeaponWallConstraint.ts` projects the current visible blade segment against active authored solid XZ footprints and returns a presentation-only scale with a 4 cm margin. `PlayerVisual` damps toward it around the hilt; leaving the wall restores full length.
- Simulation position, attack execution facing, contact sphere/reach, hit timing, and damage are unchanged.
- Pure tests cover open space, front/cardinal/swept walls, floors, and degenerate reach. Browser screenshots cover divider/border idle, locomotion, committed attack, and clear-space restoration; no tested penetration/jitter was visible. Runtime attack damage remained 70→50.

## Skirmisher presentation decision

- Product Owner rejection is authoritative: `enemy.skirmisher.proof` is not default playable art.
- Default gameplay again uses the immediately prior shared procedural skirmisher renderer; the proof GLB is neither mounted nor preloaded there.
- The GLB, manifest/budgets/provenance, semantic clips, mixer, and tests remain. `?assetProof=enemy.skirmisher.proof` is the explicit development fixture; its gate verifies load, startup, defeat, and no errors.
- Asset docs now distinguish proof/test, candidate, and Product Owner-accepted presentation.

## Browser/runtime lifecycle

- Root cause: earlier gates expected agents to start `npm run dev` separately, so no script owned that Vite PID. Historical scripts also launch Chromium with only normal-tail closure, so early throws can bypass teardown.
- Active M8 gates use `runOwnedBrowserGate`: one direct Vite child plus one Playwright page/context/browser, idempotent `finally` cleanup, signal cleanup, bounded termination, and Windows fallback limited to that recorded PID tree.
- Lifecycle proof starts real Vite + Chromium on 4191 (success) and 4192 (intentional failure), verifies page/browser/server closure, then rebinds both ports. Unit coverage separately proves owned-child exit and port reuse.
- `scripts/browser/README.md` names supported owned gates. Twenty-one older milestone scripts were audited as historical externally-served checks; their tracked launcher closes Chromium on unexpected failure/signal, and they must not be copied for new gates.

## Verification

- Focused weapon/enemy/M7/combat: 15 files / 69 tests PASS; lifecycle unit PASS.
- `npm run assets:import`, `npm run assets:verify`, `npm run gate:lifecycle`, `npm run gate:m8-stabilization`, `npm run gate:m8-skirmisher-proof`, `npm run gate:m8-shrine` PASS.
- `npm run verify` PASS: lint, typecheck, 69 files / 277 tests, asset-validated production build.
- `git diff --check`, LeanLoop doctor `--strict`, sync `--check`, git guard PASS after state refresh.
- Screenshots: `tmp-m8-stabilization/`, `tmp-m8-skirmisher-proof/`, `tmp-m8-shrine/` (ignored local evidence).
- In-app Browser discovery returned none; repository-owned Playwright Chromium supplied deterministic runtime observations.
- Environment used Node 24.11.0/npm 11.6.1 despite STACK declaring Node 22/npm 10.9.2; all gates passed, but future work should restore the declared toolchain.
- Existing Vite >500 kB chunk warning remains non-blocking.

## Remaining M8

- Product Owner visual acceptance of the wall constraint and restored procedural skirmisher.
- Broader production cast/environment remains intentionally deferred; no new asset was added in macro-batch 3.
- Compression/transcoding remains deferred until measured budgets require it.

## Recommended next M8 macro-batch

After Product Owner acceptance of stabilization, select one narrowly scoped owned/licensed candidate. Require candidate-vs-accepted presentation review before changing the playable default, use only owned runtime gates, preserve M7/combat/physics authority, and do not start M9.
