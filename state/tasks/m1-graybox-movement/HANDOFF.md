# HANDOFF
<!-- Durable end-of-session state for one task. -->
Updated: 2026-08-09 by Cursor/Composer
Task: m1-graybox-movement

## Status
M1 software foundation complete through M1.4. Controller left-stick adapter feeds the existing semantic movement intent; keyboard + gamepad compose by sum-then-clamp; lifecycle reset/suppress covered in tests. Keyboard browser verification replayed for sim/input/movement/blocker-contact/camera/resize/console. Physical controller manual verification was skipped this session by Product Owner request and remains required before vertical-slice acceptance. Product Owner M1 acceptance is pending. M2 not started.

Classification: **M1 READY FOR PRODUCT OWNER ACCEPTANCE**

## Locked decisions
- Input flow: keyboard/gamepad → adapters → `composeMovementIntents` → fixed-step sim → motor
- Composition: sum intents, then clamp magnitude to ≤ 1; sources reported as `none|keyboard|gamepad|combined`
- Gamepad: left stick only; dead zone `0.18`; stick-up → forward; unavailable/disconnect → neutral
- Focus/visibility/disconnect: keyboard resets held keys; gamepad `suppressUntilNeutral` until stick recenters
- Camera / motor / collision policy unchanged in M1.4
- Milestone label `M1.4`; diagnostic shows intent + active input source

## Runtime evidence (keyboard browser)
- Sim ticks advance; W intent `(0,1)·keyboard`; key release → neutral; W+D magnitude ≈ 1 (panel shows 0.71/0.71 rounding)
- Focus blur while holding key → neutral (no stuck movement)
- Player moves, stops, stays grounded; no floor fall-through
- Center-blocker face contact: capsule stops at face; facing marker contained; measured contact center z≈1.11 (geometric ~1.10–1.12); no visible penetration
- Camera `high-oblique-follow` stable through move/resize; no overflow; console errors empty
- Sustained WASD feel: no stuck input/latency defect found; remaining weight is accel/follow tuning debt

## Pending / debt
1. Physical controller connect/disconnect/dead-zone/reconnect manual pass (explicitly deferred this session)
2. Sustained WASD subjective weight — non-blocking M2 combat-feel candidate
3. Formal Product Owner M1 acceptance playthrough
4. Vite chunk-size advisory (unchanged, non-blocking)

## Verification
- Focused input tests: 16 passed; full suite 11 files / 32 tests
- `npm run lint`, `typecheck`, `test`, `build`, `verify`, `git diff --check`, `doctor --strict`, `sync --check`: OK
- Playwright keyboard smoke + blocker face screenshots under task `reports/` (local-only)

## Next session starts with
1. Product Owner M1 acceptance on `main` (include physical gamepad when convenient)
2. Do **not** start M2 combat until M1 is accepted (or PO explicitly redirects)
