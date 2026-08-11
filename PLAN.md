# PLAN: M8 Production Asset Pipeline — Finalization and CI Repair
<!-- Live task graph. Keep steps independently verifiable/committable. -->

Input: Product Owner M8 finalization + CI fix | Stack: `STACK.md` | Task: `m8-production-asset-pipeline`

## Non-goals

- M9 implementation, M8 self-acceptance/tagging, history changes, push, broad process supervision, broad debt backlog.

## Steps

- [x] 0. Establish repository and CI truth
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: read-only Git/CI/workflow/task-state/lifecycle inspection
  - verifier: clean Git guard; `a677887` ancestry; M7 tag peel; exact failing test/code path identified
  - evidence: clean `main` at `a677887`, equal to `origin/main`; M7 tag peels to `c93f083`; local Windows test passes; Product Owner Linux trace and source confirm POSIX group/race defect.
- [x] 1. Make owned process cleanup POSIX-safe and idempotent
  - depends: 0
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `scripts/browser/runtimeGateLifecycle.mjs`, focused lifecycle tests
  - verifier: running/already-exited/repeated cleanup and narrow ESRCH/non-ESRCH tests; `npm run gate:lifecycle`
  - evidence: PASS; 5 focused tests cover owned termination, reusable ports, already-exited/repeated cleanup, ESRCH, and EPERM; success/failure Playwright gate released ports 4191/4192.
- [x] 2. Audit durable deferred limitations
  - depends: 1
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: `state/tasks/**` read-only audit; smallest canonical debt register only if absent
  - verifier: every recorded item is current, consciously deferred, and has a revisit trigger; rejected candidates documented in M8 HANDOFF
  - evidence: PASS; all task HANDOFFs audited; no cross-milestone register existed; `state/DEBT.md` records four verified limitations with triggers and excludes roadmap scope/environment-only notes.
- [x] 3. Run CI-equivalent gate and prepare M8 acceptance handoff
  - depends: 1, 2
  - risk: HIGH
  - isolation: sequential
  - owns/allows: active M8 HANDOFF/CHECKPOINT, current-state, roadmap only if status truth changes, REPOMAP if structure changes
  - verifier: lifecycle focus, lint, typecheck, test, build, verify, workflow-equivalent commands, diff/LeanLoop/git guard, final owned-process/port audit
  - evidence: PASS; pinned clean install; Node 22/npm 10 focused 5 tests and full 68 files/285 tests; verify/build/assets; diff/doctor/sync; ports 4173/4191–4194 reusable and zero gate-owned processes.

## Decisions

- 2026-08-12 | POSIX cleanup continues targeting only the recorded child process group; `ESRCH` means the owned group is already gone, while every other signal error remains fatal.
- 2026-08-12 | M8 may become READY FOR PRODUCT OWNER ACCEPTANCE after green verification, but Codex will not self-accept, tag, or start M9.

## Escalation

- Same failure three times: persist a stuck report under the active task and stop.
- Stop if ownership-safe cleanup cannot pass Linux-sensitive tests without broad process killing.
