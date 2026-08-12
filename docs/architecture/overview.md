# Architecture Overview

## Design goal

Keep gameplay authority explicit and testable while allowing React Three Fiber to render the world and React to present UI.

## Runtime flow

```text
Device input
    ↓
Input adapter
    ↓
Player intent
    ↓
Game simulation
    ↓
Authoritative state + typed events
    ├─→ Render projection
    ├─→ UI projection
    ├─→ Audio projection
    └─→ VFX projection
```

## Layer responsibilities

### Application

Owns bootstrap, lifecycle, top-level error handling, debug-mode selection, and local application configuration.

### Game/session runtime

Owns fixed-step orchestration and composes player, combat, enemy, encounter, world, item, and save domains. It lives above feature domains in `src/game/runtime/`; low-level `game/core` must not depend upward on it.

### Simulation

Owns authoritative gameplay state and outcomes. It must not depend on React components or browser layout.

### Physics adapter

Owns Rapier integration, collision queries, raycasts, sweeps, trigger volumes, and conversion between physics and game types.

Physics reports facts. Simulation decides gameplay meaning.

### Render projection

Owns Three.js / React Three Fiber objects, camera, lighting, visual interpolation, model instances, materials, and scene lifetime.

### UI projection

Owns HUD, menus, inventory presentation, input glyphs, and accessibility semantics. UI sends intents and displays state; it does not authoritatively resolve combat.

### Content

Owns immutable authored definitions such as action, enemy, item, encounter, and zone definitions.

### Persistence

Owns versioned save schemas, validation, migration, and atomic local persistence.

### Debug fixtures

Own deterministic entry points into difficult states. Fixtures use production contracts and do not duplicate production logic.

## Dependency direction

Higher-level presentation may depend on stable game contracts. Core gameplay must not depend on React, JSX, CSS, or scene graph objects.

Avoid cross-imports between sibling feature modules. Shared contracts should be deliberately small and located in the narrowest appropriate common module.

## Initial technical constraints

- TypeScript strict mode
- npm lockfile committed
- Browser local runtime
- No backend
- Deployment remains deferred until local hardening and vertical-slice stability are accepted
- Project-authored production presentation over explicit primitive gameplay collider proxies
- Tests for pure gameplay logic without WebGL where practical
