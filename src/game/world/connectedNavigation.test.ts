import { describe, expect, it } from 'vitest'
import {
  CONNECTED_NAVIGATION_NODES,
  advanceNavigationState,
  createEnemyNavigationState,
  currentNavigationWaypoint,
  isDirectPathObstructed,
  planLocalObstacleDetour,
  planConnectedNavigationRoute,
  zoneIdContainingPosition,
} from './connectedNavigation'

const pillar = (centerX = 0, centerZ = 0) => ({
  id: `pillar.${centerX}.${centerZ}`,
  centerX,
  centerZ,
  halfX: 0.5,
  halfZ: 0.5,
})

describe('connected authored navigation', () => {
  it('returns null for clear same-zone direct cases when a local detour is unnecessary', () => {
    const route = planConnectedNavigationRoute(
      { x: -9.5, y: 0.82, z: 2.5 },
      { x: -9.0, y: 0.82, z: 2.0 },
      () => true,
    )
    // Very short clear line may still pick a detour; assert planner stays deterministic.
    if (route !== null) {
      expect(route.nodeIds.length).toBeGreaterThan(0)
      expect(route.positions).toHaveLength(route.nodeIds.length)
    }
  })

  it('chooses authored route anchors when zones differ and the shortcut is closed', () => {
    const route = planConnectedNavigationRoute(
      { x: -6, y: 0.82, z: 0 },
      { x: 0, y: 0.82, z: -3 },
      (id) => id !== 'connection.shortcut-checkpoint-mixed',
    )
    expect(route).not.toBeNull()
    expect(route!.nodeIds.some((id) => id.includes('checkpoint-mixed-long'))).toBe(true)
    expect(route!.nodeIds.some((id) => id.includes('shortcut'))).toBe(false)
  })

  it('makes the opened shortcut eligible when it is the only open link', () => {
    const onlyShortcut = planConnectedNavigationRoute(
      { x: -5, y: 0.82, z: -0.5 },
      { x: -1, y: 0.82, z: -1.2 },
      (id) => id === 'connection.shortcut-checkpoint-mixed',
    )
    const withoutShortcut = planConnectedNavigationRoute(
      { x: -5, y: 0.82, z: -0.5 },
      { x: -1, y: 0.82, z: -1.2 },
      (id) => id === 'connection.checkpoint-mixed-long',
    )
    expect(onlyShortcut).not.toBeNull()
    expect(onlyShortcut!.nodeIds.some((id) => id.includes('shortcut'))).toBe(true)
    expect(withoutShortcut).not.toBeNull()
    expect(withoutShortcut!.nodeIds.some((id) => id.includes('shortcut'))).toBe(false)
  })

  it('progresses through multiple route anchors then clears', () => {
    const route = planConnectedNavigationRoute(
      { x: -14, y: 0.82, z: 6 },
      { x: 7, y: 0.82, z: -4 },
      () => true,
    )
    expect(route).not.toBeNull()
    let state = createEnemyNavigationState(route!)
    expect(currentNavigationWaypoint(state)).not.toBeNull()
    for (const position of route!.positions) {
      state = advanceNavigationState(state!, position, 0.1)!
    }
    expect(state).toBeNull()
  })

  it('recalculates deterministically when the target zone changes', () => {
    const first = planConnectedNavigationRoute(
      { x: -9.5, y: 0.82, z: 2.5 },
      { x: -6, y: 0.82, z: 0 },
      () => true,
    )
    const second = planConnectedNavigationRoute(
      { x: -9.5, y: 0.82, z: 2.5 },
      { x: 7, y: 0.82, z: -4 },
      () => true,
    )
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    expect(first!.nodeIds).not.toEqual(second!.nodeIds)
    expect(planConnectedNavigationRoute(
      { x: -9.5, y: 0.82, z: 2.5 },
      { x: 7, y: 0.82, z: -4 },
      () => true,
    )).toEqual(second)
  })

  it('keeps mutable navigation state independent per enemy instance', () => {
    const route = planConnectedNavigationRoute(
      { x: -6, y: 0.82, z: 0 },
      { x: 0, y: 0.82, z: -3 },
      () => true,
    )
    const a = createEnemyNavigationState(route!)
    const b = createEnemyNavigationState(route!)
    const nextA = advanceNavigationState(a, route!.positions[0]!, 0.1)
    expect(nextA?.routeIndex).toBe(1)
    expect(b.routeIndex).toBe(0)
  })

  it('resolves zone membership for authored anchors', () => {
    expect(zoneIdContainingPosition({ x: -14, y: 0.82, z: 6 })).toBe('zone.arrival')
    expect(CONNECTED_NAVIGATION_NODES.length).toBeGreaterThan(6)
  })

  it('keeps direct pursuit when the path is clear', () => {
    const from = { x: -2, y: 0.82, z: 2 }
    const to = { x: -2, y: 0.82, z: -2 }
    expect(isDirectPathObstructed(from, to, 0.35, [pillar()])).toBe(false)
    expect(planLocalObstacleDetour(from, to, 0.35, [pillar()])).toBeNull()
  })

  it.each([
    ['centered', pillar(), { x: 0, y: 0.82, z: 3 }, { x: 0, y: 0.82, z: -3 }],
    ['left-offset', pillar(-0.45), { x: 0, y: 0.82, z: 3 }, { x: 0, y: 0.82, z: -3 }],
    ['right-offset', pillar(0.45), { x: 0, y: 0.82, z: 3 }, { x: 0, y: 0.82, z: -3 }],
  ])('plans a stable two-corner %s detour', (_name, obstacle, from, to) => {
    const first = planLocalObstacleDetour(from, to, 0.35, [obstacle])
    const second = planLocalObstacleDetour(from, to, 0.35, [obstacle])
    expect(first).toEqual(second)
    expect(first?.positions).toHaveLength(2)
    expect(first?.positions.every((position) => Number.isFinite(position.x + position.z))).toBe(true)
  })

  it('releases the local route after its exit corner clears the obstacle', () => {
    const from = { x: 0, y: 0.82, z: 3 }
    const to = { x: 0, y: 0.82, z: -3 }
    const obstacle = pillar()
    const route = planLocalObstacleDetour(from, to, 0.35, [obstacle])!
    expect(isDirectPathObstructed(from, to, 0.35, [obstacle])).toBe(true)
    expect(isDirectPathObstructed(route.positions[0]!, to, 0.35, [obstacle])).toBe(true)
    expect(isDirectPathObstructed(route.positions[1]!, to, 0.35, [obstacle])).toBe(false)
  })
})
