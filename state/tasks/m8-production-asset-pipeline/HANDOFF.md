# HANDOFF

Updated: 2026-08-11 by Codex
Task: m8-production-asset-pipeline

## Status

**ACTIVE — macro-batch 1 complete.** M8 remains open; M9 not started.

## Repository truth

- Clean `main` began at `c93f083`; annotated tag `v0.7.0-animation-foundation` peels to that commit.
- `origin/main` matched HEAD at start. Remote tag inspection was unavailable because outbound network access was blocked.
- Product Owner acceptance closed the historical M7 HANDOFF; no history or tag was changed.

## Baseline correction

- Root cause: one `respawnPosition` simultaneously authored checkpoint respawn, interaction, and the procedural shrine pivot, placing the player at the shrine center.
- The checkpoint definition now owns distinct immutable visual, interaction, and respawn anchors plus an explicit collision-proxy size.
- World physics owns the fixed checkpoint proxy; render does not derive collision from asset geometry.
- The checkpoint navigation anchor uses the safe interaction side. HUD and runtime proximity checks use the interaction anchor.
- Gate: lint/typecheck and 17 focused tests passed. In-app browser discovery returned no available browser, so runtime visual observation remains pending.

## Next

## Asset contract

- Manifest: `assets/production-assets.json`; editable glTF sources under `assets/source`, committed imports under `public/assets`, stable typed `/assets/...` runtime references under `src/content/assets`.
- First format contract: embedded-buffer glTF 2.0, meters, Y-up, ground-centered pivot, explicit transform, embedded PBR materials.
- `npm run assets:import` validates then copies; `npm run assets:verify` rejects missing/malformed/drifted assets and missing provenance/license. Build runs verification first.
- Collision is always an authored world proxy. Runtime never reads editable source paths. No Git LFS for the small text asset.

## Next

## First vertical slice

- `world.checkpoint.refuge-shrine` is original project-authored static glTF with committed source/runtime copies and manifest provenance.
- `CheckpointVisual` loads it through Drei `useGLTF` at the authored visual anchor. The remaining ring/light are checkpoint-state feedback, not shrine geometry or gameplay authority.
- World-authored proxy collision remains separate. Focused tests prove render uses the visual anchor, save/respawn uses a clear authored position, and missing assets report stable ID/path at validation.

## Next

## Verification

- Focused baseline: 17 checkpoint/respawn/authoring/HUD/navigation tests.
- Focused asset/integration: asset import/verify; validator/reference/presentation/save/respawn/M7 animation regressions passed.
- Full: `npm run verify` PASS — 65 files / 266 tests, lint, typecheck, asset-validated Vite production build.
- `git diff --check`, LeanLoop doctor strict, and sync check PASS; REPOMAP refreshed.
- In-app browser discovery returned no browser backend. Fresh-start, interaction, death/respawn, visible GLTF load, and console observations were therefore not manually claimed. Automated placement/physics and asset-boundary evidence is green.

## Unresolved risks

- Product Owner visual acceptance of shrine scale/material/readability and spawn clearance remains required in a controllable browser.
- The first contract intentionally supports one embedded-buffer text glTF. Binary GLB, external textures, compression, skinned assets, and asset budgets remain future M8 decisions.
- Existing Vite chunk-size warning remains non-blocking and predates this slice.

## Recommended next M8 macro-batch

Add one production-character static/skinned import proof only after choosing owned/licensed source assets and defining texture/binary size policy. Preserve the M7 animation-presentation contract; do not begin broad retargeting or M9.
