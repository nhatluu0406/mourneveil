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

## Initial budgets

Derived from the current slice (refuge shrine ~3.4KB, skirmisher proof GLB ~13KB, preexisting JS bundle ~3.5MB):

- Default per-asset limit: **256 KiB** (`ASSET_BUDGETS.maxBytesPerAsset`), overridable per entry via `maxBytes`.
- Total committed runtime assets under `public/assets`: **1 MiB**.
- Current proof entries use a tighter `maxBytes: 65536` so accidental export bloat fails fast.

Compression/transcoding is deferred until a chosen asset exceeds these budgets with measured evidence.
