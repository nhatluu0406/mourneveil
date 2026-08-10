# Production assets

- Editable sources live under `assets/source/`; runtime code never reads this directory.
- Imported runtime assets live under `public/assets/` and are committed with their source and manifest entry.
- `npm run assets:import` validates sources and copies them to canonical runtime paths.
- `npm run assets:verify` rejects missing/malformed assets, source/runtime drift, unsafe URLs, and missing provenance/license data. `npm run build` runs it first.
- M8 uses glTF 2.0, meters, Y-up, ground-centered pivots, embedded PBR materials, and explicit authored physics proxies. Render meshes never author collision.

`world.checkpoint.refuge-shrine` is original project-authored geometry with no third-party content. Its redistribution remains controlled by the repository owner because this repository currently declares no general public asset license.
