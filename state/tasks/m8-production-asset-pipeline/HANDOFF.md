# HANDOFF

Updated: 2026-08-11 by Codex
Task: m8-production-asset-pipeline

## Status

**ACTIVE — macro-batch 1, baseline and asset-contract gates passed.** M8 remains open; M9 not started.

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

Load the checkpoint shrine through the canonical reference and complete the full gate. Do not expand into character assets, broad environment art, M9, controller, or remote delivery.
