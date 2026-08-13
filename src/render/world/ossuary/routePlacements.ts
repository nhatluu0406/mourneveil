import { compileOssuaryDungeon } from '../../../content/world/dungeons/ossuary/OssuaryDungeon'
import type { WorldObjectPlacement } from '../worldObjectTypes'

/** Room-first hero-route composition compiled from the canonical ossuary dungeon. */
export const OSSUARY_ROUTE_PLACEMENTS: readonly WorldObjectPlacement[] = compileOssuaryDungeon().renderInstances

export interface OssuaryLandmarkDefinition {
  readonly id:
    | 'landmark.refuge-reliquary-crown'
    | 'landmark.combat-veil-monolith'
    | 'landmark.mixed-funeral-brazier'
    | 'landmark.ash-veil-lamp'
    | 'landmark.sepulchre-seal'
  readonly area: WorldObjectPlacement['area']
  readonly position: readonly [number, number, number]
  readonly description: string
}

export const OSSUARY_LANDMARKS: readonly OssuaryLandmarkDefinition[] = Object.freeze([
  Object.freeze({
    id: 'landmark.refuge-reliquary-crown',
    area: 'refuge',
    position: Object.freeze([-5.5, 0, 0] as const),
    description: 'Canonical veil shrine at the refuge center (checkpoint visual).',
  }),
  Object.freeze({
    id: 'landmark.combat-veil-monolith',
    area: 'first-combat',
    position: Object.freeze([-10.4, 0, 1.2] as const),
    description: 'Fractured reliquary monolith on the far watch wall.',
  }),
  Object.freeze({
    id: 'landmark.mixed-funeral-brazier',
    area: 'court',
    position: Object.freeze([0.15, 0, -6.15] as const),
    description: 'Funeral bowl on the far south court wall.',
  }),
  Object.freeze({
    id: 'landmark.ash-veil-lamp',
    area: 'ash-walk',
    position: Object.freeze([5.5, 0, -2.55] as const),
    description: 'Veil lamp marking the ashen processional.',
  }),
  Object.freeze({
    id: 'landmark.sepulchre-seal',
    area: 'final-arena',
    position: Object.freeze([13, 0, -4] as const),
    description: 'Fractured radial containment seal at the arena center.',
  }),
])

export const OSSUARY_ROUTE_CAPTURE_POINTS = Object.freeze({
  refugeWide: Object.freeze({ x: -5.2, y: 0.82, z: 0.4 }),
  refugeClose: Object.freeze({ x: -6.15, y: 0.82, z: -0.2 }),
  corridor: Object.freeze({ x: -5.5, y: 0.82, z: -3.6 }),
  firstCombat: Object.freeze({ x: -9.15, y: 0.82, z: 2.15 }),
  progressionLandmark: Object.freeze({ x: -9.15, y: 0.82, z: 3.85 }),
  mixedCourt: Object.freeze({ x: 1.1, y: 0.82, z: -4.15 }),
  ashWalk: Object.freeze({ x: 5.5, y: 0.82, z: -4.1 }),
  finalArena: Object.freeze({ x: 13, y: 0.82, z: -4 }),
})
