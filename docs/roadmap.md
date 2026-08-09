# Roadmap

This is directional milestone scope, not an execution plan. Current work and evidence live in `PLAN.md` and active task state.

## M0 — Project Foundation — COMPLETE

- Repository governance and local Vite/React/TypeScript scaffold
- React Three Fiber, Three.js, Rapier, tests, and minimal CI
- Strict TypeScript and local runtime proof

## M1 — Graybox Movement — PRODUCT OWNER ACCEPTED

- Fixed-step simulation, semantic movement intent, collision, grounding, and high-oblique camera
- Keyboard/mouse primary input and gamepad movement adapter
- Focus/input lifecycle handling and deterministic diagnostics
- Physical controller acceptance remains deferred to later input hardening

## M2 — Combat Proof — PRODUCT OWNER ACCEPTED

- Light/heavy attacks, dodge, guard, explicit action timing, contact authority, and damage
- Canvas-local combat input, execution-facing snapshot, and deterministic combat fixtures

## M3 — Enemy Framework — PRODUCT OWNER ACCEPTED

- Two proven melee roles: skirmisher and brute
- Perception, pursuit, local collision-aware steering, spacing, telegraphs, attacks, health, and defeat
- Mixed encounter lifecycle and deterministic browser/long-run verification
- Navmesh/pathfinding and a third normal role remain deferred

## M4 — Core RPG Loop — PRODUCT OWNER ACCEPTED / CLOSED

- Canonical player health/death, checkpoint/respawn, and limited healing flask
- Echoes reward, death drop, and recovery
- Deterministic loot, inventory, weapon/charm equipment, and canonical derived modifiers
- Versioned local save of stable gameplay facts

## M5 — Connected Level — NEXT / NOT STARTED

- One connected area with mixed encounters
- One meaningful shortcut
- Elite and boss progression
- Completion reward

## M6 — Presentation

- Art direction, character/enemy assets, production HUD, VFX, audio, asset ledger, and accessibility basics

## M7 — Local Hardening

- Repeated playthroughs, save/restart, controller/reconnect, focus loss, aspect ratios, performance, fresh-clone reproduction, and production-build acceptance

## Deployment gate

Deployment planning begins only after local hardening and vertical-slice stability are accepted.
