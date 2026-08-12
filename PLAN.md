# PLAN: M10 Macro-Batch 4 — Cinematic Presentation Elevation
<!-- Live M10 graph only. -->

Input: Product Owner direct visual-review pass | Stack: `STACK.md` | Contract: `docs/art/visual-direction.md`
Task slug: `m10-visual-production-identity`

## Goal

Raise the current modular M10 slice toward the dark-fantasy ARPG presentation bar using original Mourneveil design: stronger screen composition, cinematic value structure, richer actor silhouettes, subtler checkpoint/VFX language, and a full-screen HUD hierarchy without changing gameplay authority.

## Non-goals

- Copying Vesperfall/Diablo proprietary assets, UI layouts, names, or exact motifs
- Gameplay/combat/save/physics authority changes
- Class-heavy OOP rewrite, ECS, renderer rewrite, post-processing framework
- M10 closure/tag or M11

## Steps

- [x] 1. Verify modular M10 render/content boundaries and identify the highest-impact visual gap
  - Result: architecture is maintainable after ADR-0002; primary gap is presentation quality/value hierarchy rather than missing OOP.
- [x] 2. Recompose HUD into a full-screen ARPG information hierarchy
  - Result: location, threat, objective, player status, resource, prompts, and action dock are spatially separated while preserving existing HUD accessibility hooks.
- [x] 3. Establish cinematic color/tone/light treatment
  - Result: ACES tone mapping, softer DPR ceiling, dark neutral world palette, localized cyan/warm light pools, unified zone floor treatment.
- [x] 4. Refine hero/enemy/weapon presentation and checkpoint/VFX language
  - Result: Oathblade detail pass, Warden/Skirmisher/Brute silhouette accents, narrowed checkpoint rune treatment, layered veil hit/guard cues.
- [ ] 5. Run repository-native visual/gameplay/performance gates in a fully installed working tree and inspect deterministic M10 screenshots
  - Blocked in uploaded archive: `.git` and `node_modules` are not included; network dependency install is unavailable in this sandbox.

## Decisions

- 2026-08-12 | Visual reference is a quality target only. Mourneveil keeps original naming, motifs, UI composition details, and authored assets.
- 2026-08-12 | Keep ADR-0002 composition architecture; do not introduce class inheritance solely to appear more object-oriented.
- 2026-08-12 | Replace flat zone-color blocks with a continuous dark floor value structure; authored floor objects provide local identity.
- 2026-08-12 | Use ACES + local practical lights rather than globally high exposure/ambient fill.
- 2026-08-12 | HUD remains presentation-only and derives all combat/resource values from the existing runtime snapshot.

## Escalation

- If full repo verification exposes a gameplay/render regression, fix that regression before further art expansion.
- If screenshots remain materially below the target after this pass, next work should be authored surface/environment detail, not new combat systems.
