# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Cursor
Task: m2-combat-proof

## Status
M2.1–M2.6 complete. Combat Proof verified with automated suite + Playwright Chromium at the canonical local endpoint.

Classification: **M2 READY FOR PRODUCT OWNER ACCEPTANCE** (agent does not grant PO acceptance)

## Final input mappings
- WASD / left-stick: move
- LMB (canvas): light attack edge
- Shift+LMB (canvas): heavy attack edge
- Space: dodge edge
- RMB hold (canvas): guard
- UI Reset training target: health only; no combat intents

## Attack / damage authority
- Fixed-step combat action runtime owns phases; render never advances actions
- Accepted aim freezes into `attackExecutionFacing` for presentation + contact
- Light 8/4/14 · damage 20 · sphere 0.82/0.52
- Heavy 18/6/30 · damage 35 · sphere 0.98/0.68
- One hit per target per execution; defeated target clamps at 0

## Dodge / guard policy
- Dodge 2/8/8, collision-resolved active move, active-only invulnerability, no voluntary cancel
- Guard idle-only held RMB, 35% locomotion scale; blocks attack/dodge start while held

## Canonical local endpoint
- `npm run dev` → **http://127.0.0.1:4173/** (`vite.config.ts` host/port + `strictPort`)

## Verified browser evidence
- Report: `state/tasks/m2-combat-proof/reports/m2-browser-accept.json`
- Matrix: `state/tasks/m2-combat-proof/reports/m2-acceptance-matrix.md`
- All passSummary keys true; consoleErrors empty

## Remaining non-blocking debt
- Combat feel polish (production animation/VFX/audio, hit-stop architecture, controller combat play-pass)
- Bundle-size advisory
- Physical controller verification deferred
- Enemy AI/attacks, player health, stamina, parry, lock-on, combos not in M2

## Product Owner acceptance
Pending explicit PO playthrough/sign-off.

## Next
Do **not** start M3 until Product Owner accepts M2.
