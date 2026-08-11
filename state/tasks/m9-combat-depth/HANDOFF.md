# HANDOFF

Updated: 2026-08-12 by Cursor
Task: m9-combat-depth

## Status

ACTIVE — M9 final stabilization PASS. Effect cue, tmp hygiene, and perf baseline complete.

**M9 READY FOR PRODUCT OWNER ACCEPTANCE — FINAL** (not closed/tagged).

## Prior batches

- MB1 guard impact/break · MB2 hit-reaction · MB3 telegraph · MB4 player commitment/hit confirm
- M8 tag remains `v0.8.0-production-asset-pipeline`

## Stabilization outcomes

### Contact cue readability

- Root cause: full DEV/active wireframe spheres lost lower arcs to opaque floor depth under the isometric camera (depthTest correctly occluding against the floor).
- Fix: mid-body horizontal ring + soft disc (`CombatContactVolumeCue` / `combatContactCueLayout`); depthTest remains enabled so walls still occlude.
- Applied to player, procedural enemy, and skirmisher proof visuals.

### Tmp artifact hygiene

- `runOwnedBrowserGate({ artifactDir })` prepares only `tmp-m*` cwd folders and removes them in `finally` unless `KEEP_ARTIFACTS=1`.
- Wired into M8/M9 screenshot gates; `.gitignore` uses `tmp-m*`.
- Removed pre-existing `tmp-m9-*` evidence dirs during this batch.

### Performance baseline (MEASURED, idle at checkpoint, headless 1440×900)

| Metric | Value |
|--------|-------|
| drawCalls | ~139 |
| triangles | ~1.7k |
| geometries | 85 |
| textures | 3 |
| programs | 3 |
| pixelRatio | 1 (cap `[1, 1.5]`) |
| drawing buffer | 1440×900 |
| shadowMap | enabled, 1024 |
| lights | 9 |
| scene objects / meshes | 225 / 126 |
| JS heap used | ~86 MB (`performance.memory`) |

NOT reliably measurable: dedicated GPU VRAM.

Low-risk fixes applied: DPR cap 1.5; disable castShadow on low decorative rubble; AnimationMixer `uncacheRoot` on skirmisher proof unmount; repeated-combat growth gate (geo/tex/mesh Δ bounded).

Gate: `npm run gate:m9-perf-baseline`.

## Verification

- All M9 gates + lifecycle PASS; owned tmp dirs removed after PASS.
- `lint` / `typecheck` / `test` (75 files / 326 tests) / `build` / `verify` PASS.
- LeanLoop doctor `--strict`, sync `--check` PASS.

## Debt

- D-004 still open (bundle size advisory).
- No new vague performance debt; GPU VRAM remains unmeasured platform limitation, not a registered debt.

## Next

Product Owner acceptance / optional close+tag of M9. Do not start M10 without authorization.
