# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Codex
Task: m2-combat-proof

## Status
M1 is accepted and closed. M2.1 is complete: immutable combat definitions and a pure single-action runtime advance on the existing 60 Hz simulation, expose authoritative phase timing/contact state, and distinguish cancellation from interruption. M2.2 has not started.

Classification: **M2.1 COMPLETE — M2.2 NEXT**

## Locked decisions
- Durations are positive integer simulation steps; cooldown is a non-negative integer step count.
- Runtime authority is `idle → startup → active → recovery → idle`; phase transitions do not depend on animation.
- Exactly one action may be current. Registered definitions are validated, copied, and frozen.
- Cancellation and interruption have independent `never|recovery-only|active-and-recovery|always` phase-window policies.
- Contact is enabled only in `active` when a definition supplies a contact-window id.
- Resource availability is an injected start validator; no resource state or consumption exists yet.
- Debug action button submits a semantic action-id request; it is not production input wiring.

## Verification
- Focused: `npm run test -- src/game/combat src/game/character/playerRuntime.test.ts src/game/core/foundationDiagnostic.test.ts` — 3 files / 12 tests passed.
- Full: lint and typecheck passed; full suite 12 files / 41 tests passed; build and `npm run verify` passed (338 modules).
- Local Vite runtime returned HTTP 200 at `127.0.0.1:4173`.
- No controllable browser was available, so button/phase/contact visual observation remains pending.
- Existing Vite chunk-size advisory is unchanged and non-blocking.

## Not implemented
Production combat input, visible attacks, animation authority, hitboxes, damage, enemies, health, stamina state, dodge, guard, combos, VFX, and audio.

## Next session starts with
M2.2 — Player attack actions. Consume the M2.1 semantic request and runtime contracts; do not move timing authority into input or animation.
