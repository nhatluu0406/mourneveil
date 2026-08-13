import { describe, expect, it } from 'vitest'
import { OSSUARY_ROUTE_PLACEMENTS, OSSUARY_LANDMARKS, OSSUARY_ROUTE_CAPTURE_POINTS } from './routePlacements'
import { groupPlacementsByObjectId, resolveWorldObjectDefinition } from '../worldObjectRegistry'
import { MOURNEVEIL_DUNGEON_ROOMS } from './dungeonRooms'

describe('ossuary route placements', () => {
  it('covers each authored route area with reusable object types', () => {
    expect(new Set(OSSUARY_ROUTE_PLACEMENTS.map((entry) => entry.area))).toEqual(
      new Set([
        'refuge',
        'corridor',
        'first-combat',
        'court',
        'mixed-court',
        'ash-walk',
        'final-approach',
        'final-arena',
        'perimeter',
      ]),
    )
    expect(OSSUARY_ROUTE_PLACEMENTS.some((entry) => entry.objectId === 'ossuary.floor.foundation')).toBe(true)
    expect(
      OSSUARY_ROUTE_PLACEMENTS.some(
        (entry) => entry.objectId === 'ossuary.wall.bay' || entry.objectId === 'ossuary.floor.pit-rim',
      ),
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
    expect((groups.get('ossuary.floor.foundation') ?? []).length).toBeGreaterThan(7)
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
    expect(practicals.filter((entry) => entry.variant === 'actual-light').length).toBe(
      MOURNEVEIL_DUNGEON_ROOMS.reduce(
        (sum, room) => sum + room.lightAnchors.filter((anchor) => anchor.actualLight).length,
        0,
      ),
    )
    expect(practicals.length).toBeGreaterThan(5)
    expect(practicals.filter((entry) => entry.variant === 'actual-light').length).toBeLessThanOrEqual(12)
  })

  it('keeps court and sepulchre centers clear of tall dressing', () => {
    const courtCenter = OSSUARY_ROUTE_PLACEMENTS.filter(
      (entry) =>
        entry.area === 'court' &&
        entry.position[0] > -1.2 &&
        entry.position[0] < 0.4 &&
        entry.position[2] > -4.6 &&
        entry.position[2] < -2.4 &&
        !entry.objectId.startsWith('ossuary.floor.'),
    )
    expect(courtCenter).toHaveLength(0)
    const arena = OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.area === 'final-arena')
    const centerClutter = arena.filter(
      (entry) =>
        entry.position[0] > 11.6 &&
        entry.position[0] < 14.4 &&
        entry.position[2] > -5.4 &&
        entry.position[2] < -2.6 &&
        !entry.objectId.startsWith('ossuary.floor.') &&
        entry.objectId !== 'ossuary.landmark.arena-seal',
    )
    expect(centerClutter).toHaveLength(0)
  })

  it('establishes continuous foundations across every room', () => {
    const foundations = OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.objectId === 'ossuary.floor.foundation')
    expect(new Set(foundations.map((entry) => entry.area)).size).toBeGreaterThanOrEqual(7)
  })

  it('keeps perimeter silhouettes outside the walkable route', () => {
    const silhouettes = OSSUARY_ROUTE_PLACEMENTS.filter((entry) => entry.area === 'perimeter')
    expect(silhouettes.length).toBeGreaterThan(3)
    expect(silhouettes.find((entry) => entry.instanceId === 'silhouette.ash.east')?.position[0]).toBeGreaterThan(16.5)
  })
})
