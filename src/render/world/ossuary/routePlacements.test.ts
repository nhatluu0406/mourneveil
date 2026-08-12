import { describe, expect, it } from 'vitest'
import { OSSUARY_ROUTE_PLACEMENTS, OSSUARY_LANDMARKS, OSSUARY_ROUTE_CAPTURE_POINTS } from './routePlacements'
import { groupPlacementsByObjectId, resolveWorldObjectDefinition } from '../worldObjectRegistry'

describe('ossuary route placements', () => {
  it('covers each authored route area with reusable object types', () => {
    expect(new Set(OSSUARY_ROUTE_PLACEMENTS.map((entry) => entry.area))).toEqual(
      new Set(['refuge', 'corridor', 'first-combat', 'mixed-court', 'ash-walk']),
    )
    expect(
      OSSUARY_ROUTE_PLACEMENTS.some((entry) => entry.objectId === 'ossuary.floor.slab'),
    ).toBe(true)
    expect(
      OSSUARY_ROUTE_PLACEMENTS.some((entry) => entry.objectId === 'ossuary.wall.bay'),
    ).toBe(true)
  })

  it('keeps stable unique instance IDs and finite transforms', () => {
    expect(new Set(OSSUARY_ROUTE_PLACEMENTS.map((entry) => entry.instanceId)).size).toBe(
      OSSUARY_ROUTE_PLACEMENTS.length,
    )
    for (const entry of OSSUARY_ROUTE_PLACEMENTS) {
      const definition = resolveWorldObjectDefinition(entry.objectId)
      const scale = entry.scale ?? definition.defaultScale
      expect([...entry.position, ...entry.rotation, ...scale].every(Number.isFinite)).toBe(true)
      expect(scale.every((value) => value > 0)).toBe(true)
    }
  })

  it('groups instanced props for shared draw calls', () => {
    const groups = groupPlacementsByObjectId(
      OSSUARY_ROUTE_PLACEMENTS.filter(
        (entry) => resolveWorldObjectDefinition(entry.objectId).renderMode === 'instanced',
      ),
    )
    expect((groups.get('ossuary.floor.slab') ?? []).length).toBeGreaterThan(10)
    expect((groups.get('ossuary.rubble.cluster') ?? []).length).toBeGreaterThan(5)
  })

  it('requires only placement edits to relocate an arch', () => {
    const arch = OSSUARY_ROUTE_PLACEMENTS.find((entry) => entry.instanceId === 'arch.corridor.0')
    expect(arch?.objectId).toBe('ossuary.arch.full')
    expect(arch?.position[0]).toBeCloseTo(-7.78)
  })

  it('provides distinct landmarks and capture anchors', () => {
    expect(OSSUARY_LANDMARKS.map((entry) => entry.id)).toEqual([
      'landmark.refuge-reliquary-crown',
      'landmark.combat-veil-monolith',
      'landmark.mixed-funeral-brazier',
      'landmark.ash-veil-lamp',
    ])
    for (const position of Object.values(OSSUARY_ROUTE_CAPTURE_POINTS)) {
      expect([position.x, position.y, position.z].every(Number.isFinite)).toBe(true)
    }
  })

  it('separates visible practical fixtures from sparse actual light owners', () => {
    const practicals = OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId.startsWith('ossuary.light.'))
    expect(new Set(practicals.map((entry) => entry.objectId))).toEqual(new Set([
      'ossuary.light.wall-sconce',
      'ossuary.light.brazier',
      'ossuary.light.veil-lamp',
      'ossuary.light.candle-cluster',
    ]))
    expect(practicals.filter((entry) => entry.variant === 'actual-light')).toHaveLength(5)
    expect(practicals.length).toBeGreaterThan(5)
  })
})
