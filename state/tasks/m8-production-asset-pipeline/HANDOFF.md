# HANDOFF

Updated: 2026-08-11 by Cursor
Task: m8-production-asset-pipeline

## Status

**ACTIVE — macro-batch 2 complete.** M8 remains open; not tagged; M9 not started.

## Repository truth

- Started from clean `main` at `3d96324` (macro-batch 1 HEAD; ancestor of current work).
- Annotated tag `v0.7.0-animation-foundation` still peels to `c93f083`.
- No push. No M8 tag created/rewritten.

## Macro-batch 1 visual gate

- Playwright Chromium available (`chromium.launch` OK). Gates: `scripts/browser/gate-m8-shrine-visual.mjs`.
- Observations: fresh spawn clearance ≈10.4m from shrine visual; `F — Rest` prompt at interaction anchor; Rest activates; death/respawn lands on authored respawn with ≈1.3m shrine clearance; ring/light readable; no `/assets` 404 or GLTF console failures.
- No shrine code fix required.

## Asset contract expansion

- Formats: embedded `.gltf` (`gltf2`) and preferred production `.glb`.
- Textures: `none-external` | `embedded-only` only. No Draco/Meshopt/KTX2/Basis/CDN/LFS.
- Budgets: default 256 KiB/asset, 1 MiB total runtime; proof entries `maxBytes: 65536`.
- Animated assets may declare `animationSemantics` (idle/locomotion/enemy-attack/hit-reaction/defeated) validated against GLB clips.
- Docs: `docs/architecture/asset-pipeline.md`, `assets/README.md`, STACK production-asset bullet.

## Animated actor proof

- Chosen enemy: skirmisher (`enemy.skirmisher.graybox` / runtime `enemy.skirmisher.1`).
- Asset ID: `enemy.skirmisher.proof` — project-authored skinned GLB via `scripts/assets/author-skirmisher-proof-glb.mjs` (~13KB).
- Provenance/license: project-owned; no third-party content.
- Source/runtime: `assets/source/enemies/skirmisher/skirmisher-proof.glb` ↔ `public/assets/enemies/skirmisher/skirmisher-proof.glb`.
- Clip map (asset boundary only): idle→Clip_Skirm_Idle, locomotion→Clip_Skirm_Walk, enemy-attack→Clip_Skirm_Strike, hit-reaction→Clip_Skirm_Hit, defeated→Clip_Skirm_Death.
- Render path: `SkirmisherProductionVisual` consumes M7 `projectEnemyAnimation` + mixer; brute stays procedural. Capsule colliders/hurtboxes/HP/AI unchanged.

## Verification

- `npm run assets:import` / `assets:verify` PASS (shrine + skirmisher).
- Focused: pipeline, references, clip playback, M7 enemy animation, enemy gameplay/physics PASS.
- `npm run verify` PASS — 66 files / 270 tests; lint; typecheck; asset-validated build.
- `git diff --check`, LeanLoop doctor `--strict`, sync `--check` PASS.
- Browser: shrine gate PASS; skirmisher gate PASS (`tmp-m8-skirmisher/`) — GLB fetch OK, combat phases observed, defeat works, checkpoint rest/respawn still correct, no asset/page errors.
- Skirmisher proof mesh is intentionally a simple skinned box; PO may still judge final art readability separately.

## Unresolved risks / remaining M8

- M8 not closed: broader production cast (brute/player/environment), optional compression only with measured need, and any PO art-direction acceptance beyond proof readability remain open.
- Preexisting Vite chunk-size warning remains non-blocking.

## Recommended next M8 macro-batch

Choose the next owned production actor or environment prop through the same GLB contract (likely brute or a second static prop), keep M7 presentation + world-proxy collision invariants, and do not start M9.
