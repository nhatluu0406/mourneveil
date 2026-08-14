import { describe, expect, it } from 'vitest'
import {
  OSSUARY_FLOOR_SLABS,
  OSSUARY_LANDMARKS,
  OSSUARY_ROUTE_CAPTURE_POINTS,
  OSSUARY_ROUTE_PLACEMENTS,
  OSSUARY_WALL_BAYS,
} from './ossuaryEnvironmentLayout'

describe('ossuary environment route layout', () => {
  it('covers the route with one envelope plus reusable floor and wall rhythm', () => {
    const foundations = OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId === 'ossuary.floor.foundation')
    expect(foundations).toHaveLength(1)
    expect(foundations[0]?.area).toBe('perimeter')
    expect(foundations[0]?.scale).toEqual([32, 2.4, 17])
    expect(OSSUARY_FLOOR_SLABS.length).toBeGreaterThan(0)
    expect(OSSUARY_WALL_BAYS.length).toBeGreaterThan(0)
  })

  it('keeps stable unique placement IDs and finite transforms', () => {
    const placements = [...OSSUARY_FLOOR_SLABS, ...OSSUARY_WALL_BAYS]
    expect(new Set(placements.map((entry) => entry.id)).size).toBe(placements.length)
    for (const entry of placements) {
      expect([...entry.position, ...entry.rotation, ...entry.scale].every(Number.isFinite)).toBe(true)
      expect(entry.scale.every((value) => value > 0)).toBe(true)
    }
  })

  it('provides distinct refuge and progression landmarks', () => {
    expect(OSSUARY_LANDMARKS.map((entry) => entry.id)).toEqual([
      'landmark.refuge-reliquary-crown',
      'landmark.combat-veil-monolith',
      'landmark.mixed-funeral-brazier',
      'landmark.ash-veil-lamp',
      'landmark.sepulchre-seal',
    ])
    expect(new Set(OSSUARY_LANDMARKS.map((entry) => entry.area))).toEqual(
      new Set(['refuge', 'first-combat', 'court', 'ash-walk', 'final-arena']),
    )
  })

  it('defines finite deterministic capture anchors for the composed route', () => {
    for (const position of Object.values(OSSUARY_ROUTE_CAPTURE_POINTS)) {
      expect([position.x, position.y, position.z].every(Number.isFinite)).toBe(true)
    }
  })
})
