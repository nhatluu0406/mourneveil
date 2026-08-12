# ADR-0002: Data-driven modular world-object composition

- Status: Accepted
- Date: 2026-08-12

## Context

M10 environment authoring concentrated geometry, materials, landmarks, and route composition in one kit module. Product Owner required reusable object-oriented *authoring* without class-heavy inheritance OOP, while preserving simulation/render ownership and M10.2 instancing budgets.

## Decision

Use **data-driven modular object composition**:

1. **Immutable `WorldObjectDefinition`** — stable `objectId`, family, material key, shadow policy, default scale, `instanced | unique` render mode. Presentation only; never owns collision, damage, gates, or interaction outcomes.
2. **Immutable `WorldObjectPlacement`** — instance id, object id, transform, optional scale/variant/area. Route files declare *what exists where*.
3. **Typed immutable registry** — `objectId → definition (+ shared geometry/material for instanced types)`. Unknown IDs throw in development. No singleton manager, DI container, reflection, or plugin bus.
4. **Object-type modules** under `src/render/world/ossuary/` own *how* a type renders (shared geometries/materials; unique React components for landmarks).
5. **`WorldObjectComposer`** groups placements by definition and retains per-type instancing. No generalized batching engine.
6. **Gameplay authority** remains in world/physics/simulation contracts; visuals may reference solids via stable IDs only.

Class inheritance hierarchies (`BaseObject → Wall → Manager`) are rejected because they fight React/R3F projection, blur authority boundaries, and raise blast radius without improving reuse.

## Consequences

### Positive

- Adding a funerary marker variant: register/define (or reuse type) + one placement.
- Moving an arch: edit placement data only.
- Shared materials keep program count controlled.
- Clear render vs gameplay ownership.

### Negative

- Unique multi-mesh landmarks still need a small React component.
- Authors must keep placement `objectId`s registered; typos fail loudly by design.

## Links

- `src/render/world/worldObjectTypes.ts`
- `src/render/world/worldObjectRegistry.ts`
- `src/render/world/ossuary/`
- `docs/art/visual-direction.md`
