# ADR-0001: Web-based local-first game stack

- Status: Accepted
- Date: 2026-07-28

## Context

The project requires fast local iteration, readable diffs, deterministic debug routes, agent-friendly source files, and the option to deploy to the web only after a stable vertical slice exists.

## Decision

Use:

- TypeScript
- React
- Vite
- Three.js
- React Three Fiber
- `@react-three/rapier`
- npm
- Vitest
- Browser-based local runtime

Playwright may be added when deterministic routes exist and browser automation has a concrete acceptance target.

## Consequences

### Positive

- Source and configuration are text-heavy and agent-reviewable.
- Local iteration and production builds are fast.
- Deterministic debug surfaces can be ordinary routes or query-driven fixtures.
- A later static deployment should not require a game-architecture rewrite.

### Negative

- The project must build more game-specific tooling than a full engine editor provides.
- Animation, level authoring, performance discipline, and asset lifetime require explicit engineering.
- Browser and device differences require deliberate testing.

## Rejected for the initial slice

- Unity: heavier serialized/editor state and automation overhead for this workflow.
- Godot: viable, but less aligned with the desired browser-first review and agent workflow.
- Custom engine: unjustified scope and risk.
- WebGPU-only rendering: unnecessary compatibility risk before the core loop is proven.
