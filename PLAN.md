# PLAN: M10 Macro-Batch 6 — Whole-Route Render Consolidation + Composition Hardening
<!-- Live M10 graph only. -->

Input: Product Owner MB6 consolidation + composition hardening | Stack: `STACK.md` | Contract: `docs/art/visual-direction.md` + ADR-0002
Task slug: `m10-visual-production-identity`

## Goal

Confirm and reduce M10 render fragmentation (draw calls, geometries, objects/meshes) without removing practical lighting or authored dressing; harden whole-route camera composition and cheap perimeter silhouettes; ensure perf gates measure the current production route.

## Non-goals

- M11; M10 closure/tag; push
- Visual identity redesign; removing practical lights/dressing merely for green metrics
- New actor models, textures, large prop families, final arena, VFX/postprocessing stacks
- Lock-on camera, cinematic rails, per-room camera coordinates
- Gameplay/inventory/combat redesign

## Steps

- [x] 1. Performance audit: measure current route; rank fragmentation sources; verify gate coverage vs ceilings
  - depends: —
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: PLAN, gate scripts (read), focused audit notes in HANDOFF
  - verifier: `npm run gate:m9-perf-baseline && npm run gate:m10-hero-visual`
- [x] 2. Consolidate presentation: instancing, shared materials/geometries, static region merges where safe, practical-light reduction via emissive/shared pools
  - depends: 1
  - risk: HIGH
  - isolation: sequential
  - owns/allows: `src/render/**`, placement/registry tests, materials/geometries
  - verifier: `npm run test -- src/render/world && npm run lint && npm run typecheck`
- [x] 3. Camera composition + cheap perimeter silhouettes; UI cost audit only if measurable
  - depends: 2
  - risk: MEDIUM
  - isolation: sequential
  - owns/allows: camera/follow, route placements, HUD only if evidenced
  - verifier: `npm run test -- src/render && npm run gate:m10-hero-visual`
- [x] 4. Harden current-route perf gate/budgets with evidence; full regression + durable state
  - depends: 3
  - risk: HIGH
  - isolation: sequential
  - owns/allows: gate scripts, rendererStats ceilings, HANDOFF/current-state/DEBT/PLAN
  - verifier: `npm run verify && npm run gate:m8-stabilization && npm run gate:m9-player-combat && npm run gate:m9-guard-depth && npm run gate:m9-hit-reaction && npm run gate:m9-telegraph-readability && npm run gate:m9-perf-baseline && npm run gate:m10-hero-visual && npm run gate:m10-ui-compact && npm run gate:lifecycle`

## Decisions

- Optimization consolidates implementation; does not strip art direction.
- Budgets may only change with measured evidence, never silently.
- Perimeter silhouettes are the only authorized content expansion.
- 2026-08-12 | Confirmed MB5 metrics (356/193/473/283); MB5 hero budgets had been silently raised to 380/220/650/380.
- 2026-08-12 | Practical fixtures share merged module geometries; dressed collider proxies skip visual meshes; floors/zone overlays removed.
- 2026-08-12 | Follow camera gains facing look-ahead + mild closer offset; cheap perimeter silhouettes fill camera-near voids.
- 2026-08-12 | M10 perf gate samples refuge/Mixed Court/Ash Walk; production ceilings 320/80k/160/420/250/14/11 with measured headroom for one final Codex art pass.

## Escalation

- Same failure 3× → stuck report and escalate.
- Stop if consolidation requires simulation authority changes or breaking ADR-0002.
