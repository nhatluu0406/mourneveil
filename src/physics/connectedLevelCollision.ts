export type ConnectedLevelColliderKind =
  | 'floor'
  | 'wall'
  | 'blocker'
  | 'shortcut-gate'
  | 'final-gate'

export interface ConnectedLevelBoxCollider {
  readonly id: string
  readonly kind: ConnectedLevelColliderKind
  readonly position: readonly [number, number, number]
  readonly size: readonly [number, number, number]
}

export const CONNECTED_LEVEL_COLLIDERS: readonly ConnectedLevelBoxCollider[] = Object.freeze([
  box('level.floor', 'floor', [0, -0.25, 0.5], [34, 0.5, 19]),
  box('wall.west', 'wall', [-16.75, 0.75, 0.5], [0.5, 1.5, 19]),
  box('wall.east', 'wall', [16.75, 0.75, 0.5], [0.5, 1.5, 19]),
  box('wall.north', 'wall', [0, 0.75, 9.75], [33, 1.5, 0.5]),
  box('wall.south', 'wall', [0, 0.75, -8.75], [33, 1.5, 0.5]),

  // Arrival choke: the route crosses at the northern opening.
  box('wall.arrival-choke', 'wall', [-11, 0.75, -2], [0.5, 1.5, 13]),

  // Checkpoint-to-court divider: southern detour plus one locked shortcut gap.
  box('wall.shortcut-divider.south', 'wall', [-3, 0.75, -7.5], [0.5, 1.5, 2]),
  box('wall.shortcut-divider.middle', 'wall', [-3, 0.75, -3.6], [0.5, 1.5, 2.8]),
  box('wall.shortcut-divider.north', 'wall', [-3, 0.75, 4.55], [0.5, 1.5, 9.9]),
  box('gate.shortcut', 'shortcut-gate', [-3, 0.75, -1.3], [0.5, 1.5, 1.8]),

  // Final arena partition retains a boss-gate silhouette without a boss.
  box('wall.final-divider.south', 'wall', [10, 0.75, -7.05], [0.5, 1.5, 2.9]),
  box('wall.final-divider.north', 'wall', [10, 0.75, 3.45], [0.5, 1.5, 12.1]),
  box('gate.final', 'final-gate', [10, 0.75, -4], [0.5, 1.5, 2.6]),

  // Sparse navigation-safe landmarks in the combat spaces.
  box('blocker.first-combat', 'blocker', [-8.25, 0.75, 4.25], [1.1, 1.5, 1.1]),
  box('blocker.mixed.west', 'blocker', [0, 0.75, -5.8], [1, 1.5, 1]),
  box('blocker.mixed.east', 'blocker', [2.7, 0.75, -2], [1, 1.5, 1]),
  box('blocker.approach', 'blocker', [7.2, 0.75, -6.1], [0.9, 1.5, 0.9]),
])

export function activeConnectedLevelColliders(flags: {
  readonly shortcutOpen: boolean
  readonly finalGateOpen: boolean
}): readonly ConnectedLevelBoxCollider[] {
  return CONNECTED_LEVEL_COLLIDERS.filter((collider) => {
    if (collider.kind === 'shortcut-gate') return !flags.shortcutOpen
    if (collider.kind === 'final-gate') return !flags.finalGateOpen
    return true
  })
}

function box(
  id: string,
  kind: ConnectedLevelColliderKind,
  position: readonly [number, number, number],
  size: readonly [number, number, number],
): ConnectedLevelBoxCollider {
  return Object.freeze({ id, kind, position: Object.freeze(position), size: Object.freeze(size) })
}
