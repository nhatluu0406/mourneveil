# Current State

- Updated: 2026-08-09
- Milestone: **M3 Enemy Framework — M3.0 complete; M3.1 next**
- Active LeanLoop task: `m3-enemy-framework`
- Status: M2 Combat Proof is Product Owner accepted and closed. CI lockfile repaired for `npm ci`. M3 PLAN initialized; enemy runtime not started.

## What exists

- Accepted M2 Combat Proof (aim/contact/dodge/guard + browser matrix)
- Local Vite endpoint `http://127.0.0.1:4173/`
- CI: Node 22 → `npm ci` → `npm run verify`

## Known limitations

- No enemy AI/runtime yet
- Player health / incoming damage not authorized; explicit M3 PLAN gate before enemy→player damage
- Controller play-pass and production VFX/animation remain deferred
- Bundle-size advisory non-blocking

## Next executable work

M3.1 — Enemy runtime and state authority (Codex). Do not implement pursuit/AI in M3.1.
