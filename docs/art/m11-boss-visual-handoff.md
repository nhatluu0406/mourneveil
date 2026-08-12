# M11 Boss Visual Handoff (for Codex)

Technical gameplay foundation is Cursor-owned. This document is the stable hook contract for boss/arena art, VFX, and UI presentation. Do not change gameplay authority to fit art.

## Identity

| Field | Value |
| --- | --- |
| Technical ID | `boss.veilbound-sepulchre` |
| Definition ID | `enemy.boss.veilbound-sepulchre` |
| Runtime ID | `enemy.boss.sepulchre.1` |
| Encounter ID | `encounter.m11.boss` |
| Zone | `zone.final-arena` bounds `[10,16] x [-8,0]` |
| Spawn | `(13, 0.82, -4)` facing `(-1, 0)` |
| Display name (placeholder) | VEILBOUND SEPULCHRE — Codex may replace presentation copy |

## Scale / collider / pivot

- Body capsule (gameplay): radius `0.72`, halfHeight `0.85`
- Hurtbox sphere radius `0.9` at body origin
- Render pivot: feet/origin at spawn Y `0.82` (same as other enemies)
- Temporary presentation: scaled procedural large silhouette (`userData.technicalBossPresentation = true`, asset id `enemy.boss.veilbound-sepulchre.technical`)
- Replace temporary mesh; keep pivot and collider footprint unless gameplay renegotiation is explicit

## Phases

- Phase 1: HP ratio `> 0.5`
- Phase 2: HP ratio `<= 0.5` (`BOSS_PHASE_TWO_HEALTH_RATIO`)
- Presentation may accent phase; authority is HP ratio only

## Attack semantics

| Kind | Action ID | Role |
| --- | --- | --- |
| slash | `enemy.boss.slash` | Readable frontal melee |
| crush | `enemy.boss.crush` | Slow heavy / guard pressure |
| lunge | `enemy.boss.lunge` | Reposition / gap closer |
| slam | `enemy.boss.slam` | Phase-2 area/delayed pressure |

Each attack exposes startup / active / recovery via existing combat action snapshot. Contact windows use `*.contact` ids.

## AI / selection

Deterministic distance + phase pool with no immediate repeat (`selectBossAttack`). No behavior tree.

## Interrupt / guard / dodge

- Light interrupt impact: `0`
- Heavy interrupt impact: `1`
- Boss interrupt threshold: `3` (limited heavy interrupt)
- Active attack phase non-interruptible (shared enemy rule)
- Guard impact per attack: slash/lunge `1`, crush/slam `2`
- Dodge uses existing player defense windows against boss contact

## VFX / presentation hooks

Consume existing enemy presentation signals:

- `enemy.state`, `enemy.action.phase`, `enemy.action.actionId`
- `enemyAttacks[i].activeContactShape` for contact volume cues
- HP / phase for accent
- Defeat: `state === 'defeated'` / `alive === false`

Do not invent a second combat event bus.

## Arena visual constraints

- Gameplay arena already exists as `zone.final-arena` (Sealed Arena)
- Gate: `connection.gate-final-arena` (gated by M5 prerequisites, not boss defeat)
- Temporary M10 modular dressing may remain until Codex arena pass
- Keep collision/activation bounds aligned with authored zone

## Boss UI data already exposed

Threat HUD uses nearest living enemy:

- `threatTitle(definitionId)` / `threatSubtitle(definitionId)`
- HP via enemy health snapshot (`current` / `maximum`)
- Encounter active via `encounterActivation.activatedEncounterIds`
- Defeated persistence: `world.defeatedBossIds` includes `boss.veilbound-sepulchre`

Codex may restyle boss bar; do not change authoritative fields without Cursor coordination.

## Macro-batch 2 implementation

- Default presentation is the modular project-authored **Veilbound Sepulchre** renderer under `src/render/boss/`; the M8 proof-rig language is not reused.
- The existing action/phase/facing/health snapshots drive the pose, phase-two opening, contact cues, hit response, and defeat. Rendering owns no combat transition.
- `zone.final-arena` now projects an instanced dark-mid seal floor, bronze/veil containment rings, perimeter reliquaries, burial screens, banners, candelabra, hanging lanterns, and two actual arena light pools. Collision and encounter bounds are unchanged.
- HUD hierarchy is boss HP/name first during the encounter; location/objective panels yield, while player survival and equipment remain compact.
- A gameplay-contract audit found that even-length attack durations made the original modulo selector alternate slash/crush forever. Three stable player-distance fixtures (3.1 m, 2.05 m, 2.30 m) proved range gating, then a 1.75 m fixture proved lunge starvation. The narrow deterministic successor rule now makes lunge reachable without changing attack timing, damage, contact, or phase authority.
- `npm run gate:m11-boss-visual` captures the full phase/attack/defeat sequence at 1440×900 and a 1280×720 combat frame; `KEEP_ARTIFACTS=1` retains review evidence.

## Save

Persist only `defeatedBossIds` (plus existing world flags). Do not persist attack phase/camera.
