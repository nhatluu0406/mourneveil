# HANDOFF
<!-- Durable end-of-session state for one task. -->

Updated: 2026-08-09 by Cursor
Task: m4-core-rpg-loop

## Status

M4.1–M4.6 complete and verified in this session. M5 not started. Product Owner acceptance pending.

## M4.1–M4.3

- Canonical health/death, checkpoint F + respawn R, flask E — implementation from prior session.
- Gate 0 browser replay PASS (`scripts/browser/gate0-m41-m43.mjs`).

## M4.4 — Echoes

- Currency: `currency.echoes`; skirmisher +25, brute +60; once per enemy lifecycle; encounter reset clears reward flags.
- Death drops carried into one `world.echo-recovery`; amount 0 clears prior; second death replaces; respawn/checkpoint never auto-return.
- Proximity pickup range 1.05. Browser: `gate-m44-echoes.mjs` PASS.
- Commit: `044c6bc feat(progression): add Echo recovery loop`

## M4.5 — Loot / inventory / equipment

- Items: oathblade, practice-edge, vitality, ember-seal, ash-token, echo-shard.
- Slots: weapon + charm. Modifiers: oathblade +8 light/+12 heavy; vitality +20 max HP (clamp on unequip).
- Loot: skirmisher → oathblade; brute → vitality; once per encounter lifecycle.
- Compact `InventoryEquipmentPanel`; UI clicks isolated from combat.
- Browser: `gate-m45-loot.mjs` PASS.
- Commit: `b973142 feat(items): add loot inventory and equipment proof`

## M4.6 — Save

- Schema: `SaveFileV1` (`version: 1`) via `localStorage` key `mourneveil.save.v1`.
- Persists: checkpoint, flask charges, Echoes, active recovery, inventory, equipment, loot spawn/active pickup.
- Does not persist: combat/defense phases, contacts, camera, held input, enemy combat execution.
- Load policy: restore persistent facts; reset encounter enemies; clear transient combat; idle/alive.
- Migration entry accepts only V1; malformed/unknown → safe default.
- Autosave on checkpoint/respawn/currency/recovery/loot/equip/flask charge changes.
- Browser reload: `gate-m46-save.mjs` PASS; e2e: `gate-m4-e2e.mjs` PASS.

## Final verification

- 42 files / 172 tests PASS
- `npm run verify` PASS (chunk size advisory non-blocking)
- `git diff --check`, doctor --strict, sync --check PASS

## Remaining non-blocking debt

- Playwright is a devDependency for browser gates (not product runtime).
- Vite main-chunk >500 kB advisory.
- Controller deferred.
- Product Owner interactive acceptance still required.

## Next action

Product Owner runtime acceptance of M4. Do not start M5 without a new batch authorization.
