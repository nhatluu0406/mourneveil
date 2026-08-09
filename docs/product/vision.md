# Product Vision

## Working title

Mourneveil

This is a working title, not final trademark clearance.

## Product statement

Mourneveil is a compact isometric 3D action RPG in which deliberate combat, readable enemy behavior, interconnected spaces, and meaningful recovery after failure matter more than content volume.

## Player fantasy

The player is an oathbound wanderer entering a fallen domain, learning its combat language, opening a path through a compact hostile environment, defeating a guardian, and leaving the first area materially changed.

The vertical slice must prove the fantasy through play, not through lore exposition.

## Product pillars

### Deliberate combat

Actions have commitment, readable timing, clear contact, and consistent interruption rules.

### Readable danger

Enemy intention, attack range, hit confirmation, guard outcomes, and failure states are understandable without excessive UI.

### Compact exploration

One connected area uses sightlines, gates, checkpoints, encounter composition, and one meaningful shortcut to create spatial memory.

### Meaningful progression

A small amount of loot or progression changes player decisions. The first slice does not need a large inventory or skill tree.

### Local reliability

The project must be easy to run, verify, profile, and recover locally before deployment is considered.

## Camera and control direction

- Isometric or high-oblique 3D camera
- Keyboard and mouse are the current primary input
- Controller implementation and manual verification are deferred to later input hardening; controller remains a target before final vertical-slice acceptance
- No touch target during the initial vertical slice
- Camera behavior favors combat readability over cinematic freedom

## Vertical-slice target

A polished 20–30 minute local experience containing:

- One playable character
- One primary weapon moveset
- Light attack, heavy attack, dodge, and one defensive mechanic
- Three normal enemy roles
- One elite variation
- One boss
- One connected graybox-to-art-pass area
- One checkpoint
- One shortcut
- A small loot/equipment loop
- Death, respawn, and recovery
- Versioned local save
- Deterministic HUD, combat, enemy, and performance fixtures

## Explicit non-goals

- Multiplayer
- Open world
- Procedural world generation
- Multiple full classes
- Large skill tree
- Crafting
- General-purpose quest engine
- Backend, accounts, cloud saves, or live service
- Mod support
- Mobile-first support
- Deployment before local vertical-slice stability
