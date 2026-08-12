import { describe, expect, it } from 'vitest'
import { OSSUARY_ROUTE_PLACEMENTS, OSSUARY_LANDMARKS, OSSUARY_ROUTE_CAPTURE_POINTS } from './routePlacements'
import { groupPlacementsByObjectId, resolveWorldObjectDefinition } from '../worldObjectRegistry'

describe('ossuary route placements', () => {
  it('covers each authored route area with reusable object types', () => {
    expect(new Set(OSSUARY_ROUTE_PLACEMENTS.map((entry) => entry.area))).toEqual(
      new Set(['refuge', 'corridor', 'first-combat', 'mixed-court', 'ash-walk', 'final-arena', 'perimeter']),
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
      'landmark.sepulchre-seal',
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
      'ossuary.light.candelabrum',
      'ossuary.light.reliquary-lantern',
      'ossuary.light.double-sconce',
      'ossuary.light.ember-bowl',
      'ossuary.light.spectral-reliquary',
    ]))
    expect(practicals.filter((entry) => entry.variant === 'actual-light')).toHaveLength(7)
    expect(practicals.length).toBeGreaterThan(5)
  })

  it('gives the Court of Quiet Names distinct pointed architecture and source fixtures', () => {
    const court = OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.area === 'mixed-court')
    expect(court.some((entry) => entry.objectId === 'ossuary.arch.lancet')).toBe(true)
    expect(court.some((entry) => entry.objectId === 'ossuary.arch.lancet-broken')).toBe(true)
    expect(court.filter((entry) => entry.objectId === 'ossuary.niche.cluster')).toHaveLength(2)
    expect(court.some((entry) => entry.objectId === 'ossuary.light.spectral-reliquary')).toBe(true)
    expect(court.filter((entry) => entry.variant === 'actual-light')).toHaveLength(2)
  })

  it('authors a readable final arena with reusable funeral assets and a clear center', () => {
    const arena = OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.area === 'final-arena')
    expect(arena.filter((entry) => entry.objectId === 'ossuary.floor.seal-slab').length).toBeGreaterThan(30)
    expect(arena.some((entry) => entry.objectId === 'ossuary.landmark.arena-seal')).toBe(true)
    expect(arena.some((entry) => entry.objectId === 'ossuary.metal.burial-screen')).toBe(true)
    expect(arena.some((entry) => entry.objectId === 'ossuary.reliquary.broken')).toBe(true)
    expect(arena.filter((entry) => entry.variant === 'actual-light')).toHaveLength(2)
    const centerClutter = arena.filter((entry) => entry.position[0] > 11.6 && entry.position[0] < 14.4 && entry.position[2] > -5.4 && entry.position[2] < -2.6 && entry.objectId !== 'ossuary.floor.seal-slab' && entry.objectId !== 'ossuary.landmark.arena-seal')
    expect(centerClutter).toHaveLength(0)
  })

  it('keeps perimeter silhouettes outside the walkable route and non-colliding by construction', () => {
    const silhouettes = OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.area === 'perimeter')
    expect(silhouettes.length).toBeGreaterThan(8)
    expect(silhouettes.every((entry) => entry.objectId.startsWith('ossuary.'))).toBe(true)
    expect(
      silhouettes.some((entry) => entry.objectId === 'ossuary.silhouette.mass'),
    ).toBe(true)
    expect(silhouettes.some((entry) => entry.instanceId.includes('.se'))).toBe(false)
    expect(silhouettes.find((entry) => entry.instanceId === 'silhouette.ash.east')?.position[0]).toBeGreaterThan(16.5)
  })
})
