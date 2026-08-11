# Deferred Limitations

This register holds only known cross-milestone limitations that were consciously deferred and have a concrete revisit trigger. Task history and planned feature scope do not belong here. Remove an entry when its trigger is resolved or the limitation is explicitly retired.

## D-001 — Procedural weapon extreme-pose clipping

- Status: OPEN
- Observed: M7; accepted tolerance reaffirmed during M8 finalization
- Limitation: The compact procedural weapon may clip solid geometry in rare extreme animation poses.
- Why deferred: Ordinary close-wall presentation is acceptable; further constraint machinery is disproportionate for the placeholder.
- Revisit trigger: A production player/weapon rig or authored weapon asset replaces the procedural actor.
- Relevant: `src/render/PlayerVisual.tsx`, animation/render authority contract in `STACK.md`
- Product Owner tolerance: Explicitly accepted for the current placeholder.

## D-002 — Local enemy navigation scope

- Status: OPEN
- Observed: M3; narrowed and hardened in M8
- Limitation: Enemy pursuit handles authored routes and deterministic detours around simple static box footprints, not arbitrary mazes, dynamic obstacles, or global pathfinding.
- Why deferred: Current connected-level encounters are reachable under the accepted lightweight contract; a navmesh/A* system is not justified.
- Revisit trigger: Authored level geometry exceeds simple box detours, or a deterministic fixture shows a reachable route that the current policy cannot traverse.
- Relevant: `src/game/world/connectedNavigation.ts`, `src/game/runtime/GameRuntime.ts`, connected-level collision law in `STACK.md`
- Product Owner tolerance: The M8 simple-obstacle detour scope is accepted.

## D-003 — Controller verification and support

- Status: OPEN
- Observed: M1; deferred throughout the accepted foundation slice
- Limitation: Keyboard and mouse are the verified primary input; physical controller lifecycle, mapping, and acceptance remain incomplete.
- Why deferred: Current milestone direction explicitly prioritizes keyboard and mouse.
- Revisit trigger: Controller/accessibility work enters the Content Beta train or Product Owner reprioritizes input support.
- Relevant: `src/input/`, controller direction in `docs/roadmap.md`
- Product Owner tolerance: Explicitly deferred.

## D-004 — Main production bundle size

- Status: OPEN
- Observed: M1; still emitted by the M8 production build
- Limitation: Vite reports the main minified JavaScript chunk at about 3.55 MB, above its 500 kB advisory threshold.
- Why deferred: The local vertical slice builds and runs correctly; measured loading/performance work is scheduled for later maturity rather than speculative code splitting now.
- Revisit trigger: Performance profiling shows load/runtime impact, or Release Quality packaging/performance work begins.
- Relevant: `vite.config.ts`, application/render dependency boundaries
- Product Owner tolerance: Previously carried as a non-blocking build advisory; not a waiver of future performance acceptance.
