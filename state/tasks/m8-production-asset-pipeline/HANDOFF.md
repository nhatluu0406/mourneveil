# HANDOFF

Updated: 2026-08-12 by Codex
Task: m8-production-asset-pipeline

## Status

**READY FOR PRODUCT OWNER ACCEPTANCE.** M8 remains open and untagged; no M9 implementation or execution graph has started.

## Repository truth

- Work began clean on `main` at `a677887`, equal to `origin/main`; `a677887` ancestry verified.
- Annotated `v0.7.0-animation-foundation` peels to `c93f083`.
- GitHub CI trace supplied by the Product Owner identified `kill ESRCH` in the POSIX lifecycle test; the Actions page was not available from this environment.

## CI lifecycle correction

- Root cause: POSIX cleanup checked child state and then signaled `-pid`; the owned group could exit in that interval, making `process.kill` throw `ESRCH`. The Linux running-child test also failed to create the detached process group that the helper owns.
- `stopOwnedProcessTree` still signals only the recorded POSIX child group or Windows child/PID tree. A narrow signal helper treats only `ESRCH` as already gone; `EPERM` and all other errors still throw. Exit and port checks remain required.
- Linux-sensitive tests now create a detached process group and cover running termination, reusable port, already-exited/repeated cleanup, simulated raced `ESRCH`, and unexpected `EPERM`.
- The repository-owned Playwright gate passed success and intentional-failure cleanup; ports 4191/4192 were reusable.

## M8 acceptance audit

- PASS: editable `assets/source` ownership and project-authored provenance/license.
- PASS: deterministic manifest-driven import, source/runtime identity verification, malformed/missing diagnostics, and explicit budgets.
- PASS: typed canonical `/assets/...` runtime references and production-build integration.
- PASS: visible refuge shrine production slice with world-owned collision proxy.
- PASS: isolated skinned GLB proof with animation-semantic mapping; rejected proof art is not the playable default.
- PASS: render/animation remain presentation-only; gameplay/physics authority is unchanged.
- PASS: runtime visual gates, checkpoint/spawn/respawn, combat/animation regressions, obstacle detour, and stable gate lifecycle.
- No additional asset proof is technically required for M8.

## Deferred limitations

- All historical task HANDOFFs were audited. No durable cross-milestone debt register existed, so `state/DEBT.md` now records only accepted placeholder extreme-pose clipping, lightweight navigation scope, deferred controller support, and the current Vite bundle advisory.
- Deliberately excluded: planned production-art scope (roadmap work, not a defect), local Node/browser availability (agent environment, not product debt), and local Node version drift (the repository already pins/enforces Node 22/npm 10 in package metadata and CI).

## Verification

- Pinned clean install: npm 10.9.2, 237 packages, 0 vulnerabilities; host Node 24 produced the expected engine warning.
- Unsupported host Node 24 twice crashed Vitest workers after passing assertions; no lifecycle assertion failed and no owned process remained.
- CI-compatible Node 22.23.0/npm 10.9.2: focused lifecycle 2 files/5 tests PASS; full 68 files/285 tests PASS; `npm run verify`, assets, lint, typecheck, build PASS.
- `git diff --check`, LeanLoop doctor/sync, focused diff review, and final process/port audit PASS; ports 4173 and 4191–4194 are reusable with zero gate-owned processes.
- Existing Vite main chunk advisory remains and is recorded as D-004.

## M9 handoff (planning only)

- Canonical next milestone: **M9 — Combat Depth**.
- Directional goal: deepen the accepted deterministic melee combat loop without weakening simulation, action-timing, facing, contact, animation, or save authority.
- Recommended first macro-batch after M8 acceptance: Codex-led combat-contract audit and one narrowly scoped depth mechanic with explicit action/cancel/resource rules and regression gates. Exact mechanics require a new Product Owner task packet.
- Recommended agent: Codex, because the first boundary-setting work is combat-authority sensitive; later tuning/content may route to Cursor.

## Next

Product Owner accepts/closes M8 and separately authorizes any M8 tag and M9 PLAN. Do not self-accept, tag, push, or start M9 from this handoff.
