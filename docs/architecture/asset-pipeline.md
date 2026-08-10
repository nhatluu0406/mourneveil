# Production asset pipeline

M8 establishes one intentionally small path:

`assets/source` editable glTF 2.0 → `npm run assets:import` → committed `public/assets` runtime glTF → typed `/assets/...` reference → Three/Drei loader.

## Contract

- The manifest is `assets/production-assets.json`; IDs and runtime URLs are stable gameplay-independent references.
- The first slice supports embedded-buffer glTF 2.0 only: meters, Y-up, ground-centered pivot, explicit scale/rotation, embedded PBR materials.
- Runtime code may load only `/assets/...`; it never reads `assets/source`.
- Source, runtime asset, manifest, and provenance record are Git-owned together. Git LFS is not enabled for this small text asset.
- `npm run assets:verify` validates manifest/glTF structure, paths, provenance, and byte-identical import output. Production build runs this boundary first; missing/malformed/drift errors name the asset and corrective path.
- Render assets are presentation only. World-authored simple Rapier proxies own collision and remain valid if the render asset changes.
- Tests may construct malformed in-memory manifests/documents; production runtime paths must never point at test fixtures.

Future binary GLB, textures, compression, and character/skinned assets require evidence and a separate M8 contract extension; they are not implied by this first static slice.
