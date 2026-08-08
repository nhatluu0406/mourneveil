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

- [ ] 2. M1.2 — Graybox character controller
  - depends: 1
  - risk: HIGH
  - preferred agent: Codex
  - isolation: sequential
  - owns/allows: `src/game/character/`, `src/physics/` (queries only), `src/render/` only as needed to project one placeholder body, `src/debug/` fixture hook, focused tests
  - outcome: one placeholder player body; ground detection; collision-safe movement on the M0 graybox platform; no combat; deterministic debug reproduction path
  - non-goals: animation set, combat actions, camera system redesign, multiple characters
  - verifier: `npm run test -- src/game/character src/physics && npm run typecheck && npm run lint`
  - completion evidence: tests for movement/grounding pure rules; deterministic fixture documented; local runtime observation recorded; PLAN/HANDOFF updated

- [ ] 3. M1.3 — Camera and runtime tuning
  - depends: 2
  - risk: MEDIUM
  - preferred agent: Cursor
  - isolation: sequential
  - owns/allows: `src/render/` camera/follow, minor `src/app/` shell sizing if required for resize; no simulation authority changes
  - outcome: readable high-oblique follow camera; sane resize behavior; local visual tuning for graybox readability
  - non-goals: cinematic camera, free-look system, cutscenes, combat framing rules beyond follow readability
  - verifier: `npm run typecheck && npm run lint && npm run build`
  - completion evidence: recorded local runtime check (resize + follow); PLAN/HANDOFF updated

- [ ] 4. M1.4 — Controller input foundation and M1 verification
  - depends: 2, 3
  - risk: MEDIUM
  - preferred agent: Cursor (Claude independent review if needed before acceptance)
  - isolation: sequential
  - owns/allows: `src/input/` controller mapping, `src/debug/` M1 fixture, verification/docs evidence in `docs/development/current-state.md` + task HANDOFF
  - outcome: basic controller movement mapping; focus/reconnect sanity; deterministic M1 runtime fixture; production build verification; Product Owner play check pathway documented
  - non-goals: full glyph UI, rebind menu, touch, combat inputs beyond movement
  - verifier: `npm run verify && git diff --check` plus HUMAN-VERIFY: Product Owner local play of move + camera + focus-loss using the M1 fixture
  - completion evidence: `npm run verify` green; fixture path recorded; PO observations filed or explicitly pending; PLAN M1 steps ticked; current-state milestone flipped only after evidence exists

## Parallel groups
- none — M1 steps share runtime authority and projection; run sequentially

## Decisions
<!-- append-only: date | decision | reason -->
- 2026-08-08 | M1 planned before any movement implementation | LeanLoop alignment; recoverability for fresh agent sessions
- 2026-08-08 | Repair `.leanloop/install.json` managed digests to LF working-tree bytes | Adoption recorded CRLF hashes; repo uses `eol=lf`; doctor --strict was failing falsely on content-identical files

## Escalation
- Same error 3 times: stop, write stuck report under active task `reports/`, escalate to Codex (architecture) or Claude (review)
- Failed branch owner: orchestrator on the integration tree; never mix unrelated dirty main changes

## Next milestone (reference only)
- M2: Combat foundation — not planned here
