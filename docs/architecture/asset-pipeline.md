# Production asset pipeline

M8 establishes one intentionally small path:

`assets/source` editable glTF 2.0 (`.gltf` or `.glb`) → `npm run assets:import` → committed `public/assets` runtime asset → typed `/assets/...` reference → Three/Drei loader.

## Contract

- The manifest is `assets/production-assets.json`; IDs and runtime URLs are stable gameplay-independent references.
- Supported runtime formats: embedded-buffer `.gltf` and binary `.glb` (preferred for production actors). Units are meters, Y-up, ground-centered pivot, with explicit scale/rotation.
- Texture policy for the current slice: `none-external` or `embedded-only`. No external texture URLs, CDN, KTX2, Basis, Draco, or Meshopt unless a later measured M8 decision adds them.
- Animated actors may declare `animationSemantics` that map M7 presentation modes to clip names at the asset boundary. Gameplay code must not hard-code raw GLTF clip names.
- Runtime code may load only `/assets/...`; it never reads `assets/source`.
- Source, runtime asset, manifest, and provenance/license record are Git-owned together. Git LFS is not enabled for these small proof assets.
- `npm run assets:verify` validates manifest/structure, provenance, source/runtime byte identity, animation semantics when declared, and size budgets. Production build runs this boundary first; failures name the stable asset ID, path/semantic, expected condition, and remediation.
- Render assets are presentation only. World-authored simple Rapier proxies own collision and remain valid if the render asset changes.
- Tests may construct malformed in-memory manifests/documents; production runtime paths must never point at test fixtures.

## Presentation acceptance states

- **Proof/test asset:** validates import, loading, skinning, clips, or semantic mapping; it may appear only in an explicit development fixture and is not presumed fit for gameplay.
- **Candidate production asset:** may be evaluated in a playable branch/fixture but is not the accepted default presentation.
- **Product Owner-accepted presentation:** the default playable renderer. Infrastructure progress must not replace it with a visually inferior proof.

`enemy.skirmisher.proof` remains a project-owned animated GLB proof and development fixture. The default playable skirmisher uses the prior M7 procedural presentation after Product Owner rejection of the proof mesh as playable art.

## Production budgets

M8 proof fixtures remain tiny (refuge shrine ~3.4KB, skirmisher proof GLB ~13KB) and retain explicit **64 KiB** entry limits. M10 separates those proof limits from bounded production headroom:

- Default production imported-asset limit: **2 MiB** (`ASSET_BUDGETS.maxBytesPerAsset`), overridable downward per entry via `maxBytes`.
- Total committed runtime assets under `public/assets`: **12 MiB**.
- Proof entries use `maxBytes: 65536`, so expanding production headroom cannot silently bloat fixtures.
- Code-native authored visual assemblies use stable IDs and provenance in `src/content/assets/productionVisualLedger.ts`; their runtime cost is bounded by the M10 renderer/performance gate instead of binary byte size.

These are ceilings, not targets. Compression/transcoding remains deferred until a chosen asset or measured load cost demonstrates need.
