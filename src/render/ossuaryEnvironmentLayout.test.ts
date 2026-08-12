import { describe, expect, it } from 'vitest'
import {
  OSSUARY_FLOOR_SLABS,
  OSSUARY_LANDMARKS,
  OSSUARY_ROUTE_CAPTURE_POINTS,
  OSSUARY_WALL_BAYS,
} from './ossuaryEnvironmentLayout'

describe('ossuary environment route layout', () => {
  it('covers each authored route area with reusable floor and wall rhythm', () => {
    expect(new Set(OSSUARY_FLOOR_SLABS.map((entry) => entry.area))).toEqual(
      new Set(['refuge', 'corridor', 'first-combat', 'mixed-court', 'ash-walk']),
    )
    expect(new Set(OSSUARY_WALL_BAYS.map((entry) => entry.area))).toEqual(
      new Set(['refuge', 'corridor', 'first-combat', 'mixed-court']),
    )
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
    ])
    expect(new Set(OSSUARY_LANDMARKS.map((entry) => entry.area))).toEqual(
      new Set(['refuge', 'first-combat', 'mixed-court', 'ash-walk']),
    )
  })

  it('defines finite deterministic capture anchors for the composed route', () => {
    for (const position of Object.values(OSSUARY_ROUTE_CAPTURE_POINTS)) {
      expect([position.x, position.y, position.z].every(Number.isFinite)).toBe(true)
    }
  })
})
