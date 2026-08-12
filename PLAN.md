# PLAN: M13 Character Progression & Build Identity — Macro-batch 4
<!-- Live M13 graph only. -->

Input: Product Owner M13 MB4 presentation brief | Stack: `STACK.md`
Task slug: `m13-character-progression-build-identity`
Agent: Codex only

## Goal

Make active skills and progression visibly native to Mourneveil, eliminate native inventory scrolling at 1440×900, and materially improve the Refuge–Court hero frames without changing gameplay authority.

## Non-goals

- Skill timing, damage, cooldown, movement, guard, unlock, progression, or SaveFileV4 changes
- New region, gameplay system, external assets, third-party icons, controller, M14
- New render authority, per-activation resources, or broad world/camera refactor

## Steps

- [x] 1. Reproduce and fix Oath & Armory overflow contract
  - depends: —
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/ui/**`, `src/app/styles.css`, M13 visual gate
  - verifier: focused UI tests + 1440×900 no-scroll assertions + 1280×720 single-owned-scroller assertion
- [x] 2. Add skill identity and actor presentation
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: presentation-only skill glyph/VFX/pose modules, `PlayerVisual`, restrained enemy materials
  - verifier: focused skill presentation/animation tests + `gate:m13-active-skills` + M13 visual captures
- [x] 3. Uplift Refuge–Court world art and complete integration
  - depends: 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: ADR-0002 world types/registry/placements/shared materials, gates, docs/state
  - verifier: route/world tests + M13 visual gate + M10 performance/resource soak + requested regressions + `npm run verify`

## Locked decisions

- All skill movement/contact/effect/timing remains simulation-owned; animation, VFX, icons, HUD, and environment are projections only.
- 1440×900 has no page, panel, or native owned scrollbar; 1280×720 may scroll only the relic inventory region.
- Skill vocabulary: Veil Step torn rupture; Oath Cleave bronze oath-force; Ward Pulse angular containment facets.
- Visible fixtures outnumber actual lights; shared geometry/materials and conditional VFX must avoid activation-time resource growth.

## Escalation

- Same failure 3× → stuck report + stop.
- Any need to redesign skill/progression/save/combat authority → stop for review.
