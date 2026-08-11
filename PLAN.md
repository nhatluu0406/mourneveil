# PLAN: M9 Final Stabilization — Effect Render + Tmp Hygiene + Perf Baseline
<!-- Live M9 graph only. -->

Input: Product Owner final stabilization | Stack: `STACK.md` | Task: `m9-combat-depth`

## Goal

Fix clipped DEV/active combat contact cues, ensure gate-owned tmp artifacts clean up, measure a performance baseline and apply only evidenced low-risk hygiene — without combat redesign, M10, or self-close/tag.

## Non-goals

- New VFX framework, global depthTest disable, HUD always-on-top cues, LOD/instancing/WebGPU, aggressive visual downgrade, combat retune, M10, push/tag/close M9.

## Steps

- [x] 0. Lock root causes + PLAN
- [x] 1. Fix contact-cue render readability (player + enemy DEV active cue)
- [x] 2. Gate-owned tmp artifact cleanup + remove existing disposable tmp-*
- [x] 3. Perf baseline gate + evidenced low-risk fixes
- [x] 4. Full verify + HANDOFF + M9 final readiness

## Locked findings

- Effect: full wireframe spheres lose lower arcs to opaque floor depth under isometric camera; replaced with mid-body horizontal ring+disc (depthTest kept for walls).
- Tmp: gates now pass `artifactDir` into `runOwnedBrowserGate`; cleanup unless `KEEP_ARTIFACTS=1`.
- Perf (measured idle checkpoint): ~139 drawCalls, ~1.7k tris, DPR capped at 1.5, shadow map 1024, ~86MB JS heap (Chromium `performance.memory`); no GPU VRAM API available.

## Escalation

- Stop if readability requires always-on-top HUD or new VFX authority.
- Same failure 3× → stuck report.
