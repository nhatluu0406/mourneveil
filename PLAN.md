# PLAN: M1 Graybox Movement Foundation
<!-- Live execution graph for M1 only. Tick steps when green; do not invent M2 combat work here. -->

Input: M0 foundation complete in repo; Product Owner M0 browser acceptance still open | Stack: STACK.md | Contract: `docs/product/vertical-slice.md`, `docs/architecture/overview.md`
Task slug: `m1-graybox-movement` (`python3 scripts/leanloop/task.py start m1-graybox-movement`)

## Non-goals
- Combat, enemies, stamina/posture, loot, save, audio production, art pass
- Cinematic/free camera system, touch input, backend, deployment
- Broad ECS/framework introduction; empty module scaffolding beyond owned paths
- M2 combat implementation (next milestone after M1 acceptance only)

## Steps
<!-- risk: LOW|MEDIUM|HIGH ; isolation: inline|sequential|worktree -->

- [x] 1. M1.1 — Simulation and input authority
  - depends: —
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential (clean tree / worktree if main is dirty)
  - owns/allows: `src/game/core/`, `src/input/`, `src/debug/` (diagnostic only), focused tests under those trees, docs touch only if runtime contracts change
  - outcome: deterministic/fixed-step simulation foundation; typed player input intents; focus-loss/reset clears stuck intents; pure tests; runtime diagnostic proving sim ticks + intent sampling without character locomotion unless required to prove the contract
  - non-goals: character controller, camera retune, combat, controller full mapping beyond what proves the intent contract
  - verifier: `npm run test -- src/game/core src/input && npm run typecheck && npm run lint`
  - completion evidence: passing pure tests for clock/intent/focus-reset; diagnostic visible in local runtime; PLAN step ticked; HANDOFF updated

- [x] 2. M1.2 — Graybox character controller
  - depends: 1
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: `src/game/character/`, `src/physics/` (queries only), `src/render/` only as needed to project one placeholder body, `src/debug/` fixture hook, focused tests
  - outcome: one placeholder player body; ground detection; collision-safe movement on the M0 graybox platform; no combat; deterministic debug reproduction path
  - non-goals: animation set, combat actions, camera system redesign, multiple characters
  - verifier: `npm run test -- src/game/character src/physics && npm run typecheck && npm run lint`
  - completion evidence: tests for movement/grounding pure rules; deterministic fixture documented; local runtime observation recorded; PLAN/HANDOFF updated

- [x] 3. M1.3 — Camera and runtime tuning
  - depends: 2
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: `src/render/` camera/follow, minor `src/app/` shell sizing if required for resize; no simulation authority changes
  - outcome: readable high-oblique follow camera; sane resize behavior; local visual tuning for graybox readability
  - non-goals: cinematic camera, free-look system, cutscenes, combat framing rules beyond follow readability
  - verifier: `npm run typecheck && npm run lint && npm run build`
  - completion evidence: recorded local runtime check (resize + follow); PLAN/HANDOFF updated
  - residual defects at completion: center-blocker visual clipping routed to blocking step 3a; sustained WASD feel lag deferred by PO

- [x] 3a. M1.2.1 — Character collision correctness (blocking defect)
  - depends: 2, 3
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: `src/game/character/`, `src/physics/`, player render projection, center-blocker fixture, focused tests, active M1 state
  - outcome: evidence-backed center-blocker diagnosis; smallest authority-preserving fix; deterministic real-Rapier regression proving collision-corrected movement does not penetrate beyond tolerance
  - non-goals: motor redesign, controller input, camera retuning/interpolation, combat, M1.4 implementation
  - verifier: `npm run test -- src/game/character src/physics src/render/PlayerVisual.test.ts && npm run verify && git diff --check`
  - completion evidence: physical-versus-visual geometry recorded; regression green; runtime observation recorded or explicitly pending; HANDOFF/CHECKPOINT updated

- [x] 4. M1.4 — Controller input foundation and M1 verification
  - depends: 2, 3, 3a
  - risk: MEDIUM
  - preferred agent: Cursor (Claude independent review if needed before acceptance)
  - isolation: sequential
  - owns/allows: `src/input/` controller mapping, `src/debug/` M1 fixture, verification/docs evidence in `docs/development/current-state.md` + task HANDOFF
  - outcome: basic controller movement mapping; focus/reconnect sanity; deterministic M1 runtime fixture; production build verification; Product Owner play check pathway documented
  - non-goals: full glyph UI, rebind menu, touch, combat inputs beyond movement
  - verifier: `npm run verify && git diff --check` plus HUMAN-VERIFY: Product Owner local play of move + camera + focus-loss using the M1 fixture
  - completion evidence: `npm run verify` green; keyboard browser smoke recorded; physical controller pending by PO choice; PLAN/HANDOFF updated; M1 ready for PO acceptance
  - residual: physical gamepad manual pass; sustained WASD feel tuning debt (not correctness)

## Parallel groups
- none — M1 steps share runtime authority and projection; run sequentially

## Decisions
<!-- append-only: date | decision | reason -->
- 2026-08-08 | M1 planned before any movement implementation | LeanLoop alignment; recoverability for fresh agent sessions
- 2026-08-08 | Repair `.leanloop/install.json` managed digests to LF working-tree bytes | Adoption recorded CRLF hashes; repo uses `eol=lf`; doctor --strict was failing falsely on content-identical files
- 2026-08-09 | M1.3 follow camera is presentation-only: damped look target + rigid high-oblique offset (`FOLLOW_DAMPING=12`) | Keeps isometric framing; must not write into simulation
- 2026-08-09 | No player-mesh interpolation in M1.3 | 60 Hz motor + damped camera sufficient for graybox; avoid coupling render alpha into authority
- 2026-08-09 | Throttle foundation diagnostic React updates (~10 Hz); keep sim/camera every frame | Reduce sustained-input UI jank without changing motor
- 2026-08-09 | Do not mask M1.2 center-blocker clipping or movement-feel lag inside M1.3 | MEDIUM camera task; HIGH motor/collision remains open for a later fix
- 2026-08-09 | M1.2.1 confirmed center-blocker clipping was the facing marker extending beyond a collision-safe capsule; keep visual geometry contained by the shared capsule dimensions | Real Rapier regression preserves the existing 2 cm separation policy; no motor, physics, or camera retune required
- 2026-08-09 | Controller left-stick maps into existing semantic `PlayerMovementIntent` with dead zone `0.18`; composition = sum then clamp magnitude ≤ 1 | One gameplay authority; keyboard-only unchanged; no second movement path
- 2026-08-09 | Gamepad focus-loss/disconnect uses suppress-until-neutral; poll only in the app/input rAF boundary | Prevents stale stick drive without a second loop or sim timing coupling
- 2026-08-09 | Sustained WASD “lag” classified as deliberate accel/camera-follow feel debt for later combat-feel work, not input latency | No motor constant change in M1.4

## Escalation
- Same error 3 times: stop, write stuck report under active task `reports/`, escalate to Codex (architecture) or Claude (review)
- Failed branch owner: orchestrator on the integration tree; never mix unrelated dirty main changes

## Next milestone (reference only)
- M2: Combat foundation — not planned here
