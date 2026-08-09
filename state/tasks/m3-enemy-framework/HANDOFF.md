# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Cursor
Task: m3-enemy-framework

## Status
M3.0 complete. CI lockfile repaired; M2 closed as Product Owner accepted; M3 Enemy Framework PLAN initialized. **Do not start M3.1 in this session.**

Classification: **M3.0 COMPLETE — M3.1 NEXT**

## Locked decisions
- M2 Combat Proof is Product Owner accepted and closed.
- CI baseline remains: checkout → Node 22 → `npm ci` → `npm run verify` (no LeanLoop/Python in CI).
- Lockfile must record `@emnapi/core@1.11.3` and `@emnapi/runtime@1.11.3` so Linux `npm ci` matches peer installs from `@napi-rs/wasm-runtime`.
- Player incoming-damage/health for enemy attacks is an explicit unresolved PLAN gate before any step that applies player damage.

## In flight
- None. Next executable step is M3.1 (Codex, HIGH).

## Known traps
- Regenerating `package-lock.json` with npm 11 alone may omit npm-10 peer entries; prefer npm 10 (`npx npm@10 install --package-lock-only`) when touching the lock for CI.
- Local Vite endpoint remains `http://127.0.0.1:4173/`.

## Next session starts with
1. Execute M3.1 — Enemy runtime and state authority (no AI/pursuit yet). Resolve nothing about player health until the PLAN gate is decided.
