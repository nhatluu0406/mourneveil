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
  /** Optional presentation tint; collision always uses kind materials by default. */
  readonly color?: string
}

/**
 * Authored solid graybox props. These are gameplay solids: visual and collider
 * must share the same center/extents (no render-only blocking props).
 */
export const CONNECTED_LEVEL_LANDMARKS: readonly ConnectedLevelBoxCollider[] = Object.freeze([
  box('landmark.arrival-post', 'blocker', [-14.2, 0.95, 7.4], [0.35, 1.9, 0.35], '#6f8578'),
  box('landmark.watch-column', 'blocker', [-10.4, 1.1, 1.2], [0.45, 2.2, 0.45], '#748a7a'),
  box('landmark.court-obelisk', 'blocker', [1.1, 1.15, -6.4], [0.4, 2.3, 0.4], '#8a6b52'),
  box('landmark.approach-cairn', 'blocker', [8.4, 0.85, -2.4], [0.7, 1.5, 0.7], '#6e5858'),
  box('landmark.arena-frame-left', 'blocker', [11.2, 1.35, -5.4], [0.35, 2.7, 0.35], '#6a4f5d'),
  box('landmark.arena-frame-right', 'blocker', [11.2, 1.35, -2.6], [0.35, 2.7, 0.35], '#6a4f5d'),
])

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

  // Sparse navigation-safe blockers in the combat spaces.
  box('blocker.first-combat', 'blocker', [-8.25, 0.75, 4.25], [1.1, 1.5, 1.1]),
  box('blocker.mixed.west', 'blocker', [0, 0.75, -5.8], [1, 1.5, 1]),
  box('blocker.mixed.east', 'blocker', [2.7, 0.75, -2], [1, 1.5, 1]),
  box('blocker.approach', 'blocker', [7.2, 0.75, -6.1], [0.9, 1.5, 0.9]),

  ...CONNECTED_LEVEL_LANDMARKS,
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

/** Axis-aligned footprint test for spawn/route safety (XZ only). */
export function horizontalFootprintOverlapsSolid(
  x: number,
  z: number,
  radius: number,
  flags: { readonly shortcutOpen: boolean; readonly finalGateOpen: boolean } = {
    shortcutOpen: false,
    finalGateOpen: false,
  },
): ConnectedLevelBoxCollider | null {
  for (const collider of activeConnectedLevelColliders(flags)) {
    if (collider.kind === 'floor') continue
    const halfX = collider.size[0] / 2
    const halfZ = collider.size[2] / 2
    const dx = Math.max(
      Math.abs(x - collider.position[0]) - halfX,
      0,
    )
    const dz = Math.max(
      Math.abs(z - collider.position[2]) - halfZ,
      0,
    )
    if (Math.hypot(dx, dz) < radius) {
      return collider
    }
  }
  return null
}

function box(
  id: string,
  kind: ConnectedLevelColliderKind,
  position: readonly [number, number, number],
  size: readonly [number, number, number],
  color?: string,
): ConnectedLevelBoxCollider {
  return Object.freeze({
    id,
    kind,
    position: Object.freeze(position),
    size: Object.freeze(size),
    ...(color === undefined ? {} : { color }),
  })
}
