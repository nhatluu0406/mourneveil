import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from '../game/world/checkpoint'

export type ConnectedLevelColliderKind =
  | 'floor'
  | 'wall'
  | 'blocker'
  | 'checkpoint'
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

  // Checkpoint-to-court divider: intentional southern detour gap (~1.5m) plus locked shortcut.
  // South ends at z=-6.5; middle begins at z=-5.0 — that gap is the authored southern route.
  box('wall.shortcut-divider.south', 'wall', [-3, 0.75, -7.5], [0.5, 1.5, 2]),
  box('wall.shortcut-divider.middle', 'wall', [-3, 0.75, -3.6], [0.5, 1.5, 2.8]),
  box('wall.shortcut-divider.north', 'wall', [-3, 0.75, 4.55], [0.5, 1.5, 9.9]),
  box('gate.shortcut', 'shortcut-gate', [-3, 0.75, -1.3], [0.5, 1.5, 1.8]),

  // Final arena partition: segments intentionally overlap endpoints (no micro-gaps).
  box('wall.final-divider.south', 'wall', [10, 0.75, -7.25], [0.5, 1.5, 3.5]),
  box('wall.final-divider.north', 'wall', [10, 0.75, 3.35], [0.5, 1.5, 12.3]),
  box('gate.final', 'final-gate', [10, 0.75, -4], [0.5, 1.5, 2.9]),

  // Sparse navigation-safe blockers in the combat spaces.
  box('blocker.first-combat', 'blocker', [-8.25, 0.75, 4.25], [1.1, 1.5, 1.1]),
  box('blocker.mixed.west', 'blocker', [0, 0.75, -5.8], [1, 1.5, 1]),
  box('blocker.mixed.east', 'blocker', [2.7, 0.75, -2], [1, 1.5, 1]),
  box('blocker.approach', 'blocker', [7.2, 0.75, -6.1], [0.9, 1.5, 0.9]),

  box(
    'checkpoint.refuge.proxy',
    'checkpoint',
    [
      CONNECTED_LEVEL_CHECKPOINT_DEFINITION.visualPosition.x,
      CONNECTED_LEVEL_CHECKPOINT_DEFINITION.collisionSize[1] / 2,
      CONNECTED_LEVEL_CHECKPOINT_DEFINITION.visualPosition.z,
    ],
    CONNECTED_LEVEL_CHECKPOINT_DEFINITION.collisionSize,
  ),

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

export interface WallSegmentContinuityIssue {
  readonly along: 'x' | 'z'
  readonly axisValue: number
  readonly gapStart: number
  readonly gapEnd: number
  readonly gapLength: number
  readonly leftId: string
  readonly rightId: string
}

/**
 * Detect unintended gaps between collinear wall/gate segments that share a centerline.
 * Intentional openings must be listed in `allowedGaps` (same along/axisValue + overlapping range).
 */
export function findUnintendedWallSegmentGaps(
  colliders: readonly ConnectedLevelBoxCollider[],
  allowedGaps: readonly {
    readonly along: 'x' | 'z'
    readonly axisValue: number
    readonly gapStart: number
    readonly gapEnd: number
  }[] = [],
  {
    axisTolerance = 0.05,
    maxUnintendedGap = 0.15,
  }: { readonly axisTolerance?: number; readonly maxUnintendedGap?: number } = {},
): readonly WallSegmentContinuityIssue[] {
  const segments = colliders.filter(
    (entry) => entry.kind === 'wall' || entry.kind === 'shortcut-gate' || entry.kind === 'final-gate',
  )
  const issues: WallSegmentContinuityIssue[] = []

  for (const along of ['x', 'z'] as const) {
    const axisIndex = along === 'x' ? 0 : 2
    const runIndex = along === 'x' ? 2 : 0
    const groups = new Map<number, Array<{ id: string; start: number; end: number }>>()

    for (const segment of segments) {
      const thickness = segment.size[axisIndex]
      // Only treat thin barrier slabs (walls spanning the other axis).
      if (thickness > 1.2) continue
      const axisValue = segment.position[axisIndex]
      const halfRun = segment.size[runIndex] / 2
      const start = segment.position[runIndex] - halfRun
      const end = segment.position[runIndex] + halfRun
      let groupKey: number | null = null
      for (const key of groups.keys()) {
        if (Math.abs(key - axisValue) <= axisTolerance) {
          groupKey = key
          break
        }
      }
      if (groupKey === null) {
        groupKey = axisValue
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push({ id: segment.id, start, end })
    }

    for (const [axisValue, group] of groups) {
      const ordered = [...group].sort((a, b) => a.start - b.start || a.end - b.end)
      for (let index = 0; index < ordered.length - 1; index += 1) {
        const left = ordered[index]!
        const right = ordered[index + 1]!
        const gapStart = left.end
        const gapEnd = right.start
        const gapLength = gapEnd - gapStart
        if (gapLength <= maxUnintendedGap) continue
        const allowed = allowedGaps.some(
          (gap) =>
            gap.along === along &&
            Math.abs(gap.axisValue - axisValue) <= axisTolerance &&
            gap.gapStart <= gapStart + 0.05 &&
            gap.gapEnd >= gapEnd - 0.05,
        )
        if (allowed) continue
        issues.push({
          along,
          axisValue,
          gapStart,
          gapEnd,
          gapLength,
          leftId: left.id,
          rightId: right.id,
        })
      }
    }
  }

  return issues
}

/** Authored southern detour through the checkpoint divider (not a collider hole bug). */
export const CONNECTED_LEVEL_ALLOWED_WALL_GAPS = Object.freeze([
  Object.freeze({
    along: 'x' as const,
    axisValue: -3,
    gapStart: -6.5,
    gapEnd: -5,
  }),
])

export function assertConnectedLevelWallContinuity(
  colliders: readonly ConnectedLevelBoxCollider[] = CONNECTED_LEVEL_COLLIDERS,
): void {
  const issues = findUnintendedWallSegmentGaps(colliders, CONNECTED_LEVEL_ALLOWED_WALL_GAPS)
  if (issues.length > 0) {
    const detail = issues
      .map(
        (issue) =>
          `${issue.leftId}→${issue.rightId} along ${issue.along}=${issue.axisValue} gap=${issue.gapLength.toFixed(3)}`,
      )
      .join('; ')
    throw new Error(`Connected-level wall continuity failed: ${detail}`)
  }
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
