# HANDOFF

Updated: 2026-08-12 by Codex
Task: m9-combat-depth

## Status

ACTIVE — M9 macro-batch 1 PASS. Guard impact / temporary guard break is complete; M9 is not closed.

## M8 closure

- Product Owner accepted M8. Commit `244aab1` records closure and annotated tag `v0.8.0-production-asset-pipeline` points to it.
- Closure re-verification: Node 22.23.0/npm 10.9.2; lifecycle 5/5; owned browser success/failure cleanup; full 68 files/285 tests; assets/build PASS.

## Combat authority audit

- Typed input requests attacks/dodge and holds guard. `GameRuntime` accepts requests; `CombatActionRuntime` alone advances fixed-step startup/active/recovery.
- Accepted player attacks freeze semantic aim for presentation and contact. Rapier overlap and solid-world occlusion return candidates; `CombatContactRuntime` deduplicates the target per execution before damage or guard impact.
- Dodge invulnerability exists only during authoritative dodge active steps. Guard exists only while idle. The existing 120-degree XZ frontal cone protects toward the attacker; rear/side contacts damage normally.
- Enemies own state/action timing and an accepted attack-facing snapshot. Shared contact resolution passes their active contact to player defense and canonical health.
- There is no stamina, poise, stagger, new cancel system, or persisted transient combat state.

## Guard impact / break contract

- Skirmisher blocked contact contributes 1 impact; brute contributes 2. HP damage remains zero for guarded and threshold-breaking contacts.
- Threshold 3 returns `guard-broken`, clears held/active guard, and begins a fixed 72-step vulnerability window. Further contact is normal damage; guard input is ignored during the break.
- Partial impact resets after 180 fixed steps without another guarded hit. Break recovery clears impact and restores guard availability. Death, development restore, respawn, and save application clear the transient defense runtime; SaveFileV2 is unchanged.
- Per-execution contact dedup happens before the mutating defense resolver, so an active window cannot add duplicate impact.

## Presentation

- Existing guard pose/marker stays cyan. Guard break projects through the typed hit-reaction channel, turns the marker/actor feedback red, adds a stronger existing camera impulse, and displays `Guard Broken` in the HUD.
- Recent guarded contacts display `Blocked · Impact n/3`. Animation, HUD, render mesh, and physics remain non-authoritative.

## Runtime evidence

- Owned Playwright gate `npm run gate:m9-guard-depth` uses the real introduction skirmisher and semantic RMB guard.
- Observed: `guarded → guarded → guard-broken → damaged`; canonical HP decreased; release/re-press after recovery guarded again; facing away produced normal damage.
- Screenshots under ignored `tmp-m9-guard-depth/` were inspected: red break warning/pose, restored cyan guard marker, and rear-bypass HP loss were visible. No page errors.
- Browser/page/Vite cleanup passed and port 4195 was reusable.

## Verification

- Focused guard/contact/enemy-role/M7 animation: 7 files / 49 tests PASS.
- Focused contact physics/navigation/respawn/checkpoint/M7/lifecycle: 8 files / 36 tests PASS.
- `npm run assets:verify`, `npm run gate:lifecycle`, `npm run gate:m9-guard-depth`: PASS.
- Node 22.23.0/npm 10.9.2 `npm run verify`: lint/typecheck, 68 files / 291 tests, assets, production build PASS.
- Existing Vite main-chunk advisory remains D-004.

## Debt

- No debt added or resolved. The guard slice introduces no known deferred defect; broader combat mechanics are roadmap work, not debt.

## Next

Recommended M9 macro-batch 2: Codex should audit hit-reaction/stagger gaps and define one narrow enemy hit-stun/interrupt contract, starting with player heavy attacks versus the two existing roles. Do not add a universal posture/stamina system without Product Owner scope.
