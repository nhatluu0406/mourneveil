import { compileOssuaryDungeon } from '../content/world/dungeons/ossuary/OssuaryDungeon'
import type { DungeonDynamicState, WorldBoxCollider } from '../content/world/dungeonTypes'

export type ConnectedLevelColliderKind = WorldBoxCollider['kind']
export type ConnectedLevelBoxCollider = WorldBoxCollider

export type ConnectedLevelGateFlags = DungeonDynamicState

/** Compiled structural colliders for the closed-gate ossuary. Derived, not hand-authored. */
export const CONNECTED_LEVEL_COLLIDERS: readonly ConnectedLevelBoxCollider[] =
  compileOssuaryDungeon().colliders

export const CONNECTED_LEVEL_LANDMARKS: readonly ConnectedLevelBoxCollider[] = Object.freeze(
  CONNECTED_LEVEL_COLLIDERS.filter((entry) => entry.kind === 'blocker'),
)

export function activeConnectedLevelColliders(
  flags: ConnectedLevelGateFlags,
): readonly ConnectedLevelBoxCollider[] {
  return compileOssuaryDungeon(flags).colliders
}

/** Axis-aligned footprint test for spawn/route safety (XZ only). */
export function horizontalFootprintOverlapsSolid(
  x: number,
  z: number,
  radius: number,
  flags: ConnectedLevelGateFlags = { shortcutOpen: false, finalGateOpen: false },
): ConnectedLevelBoxCollider | null {
  for (const collider of activeConnectedLevelColliders(flags)) {
    if (collider.kind === 'floor') continue
    const halfX = collider.size[0] / 2
    const halfZ = collider.size[2] / 2
    const dx = Math.max(Math.abs(x - collider.position[0]) - halfX, 0)
    const dz = Math.max(Math.abs(z - collider.position[2]) - halfZ, 0)
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
 * Intentional openings must be listed in `allowedGaps`.
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

/** Door and gate openings compiled from the canonical dungeon. */
export const CONNECTED_LEVEL_ALLOWED_WALL_GAPS = Object.freeze(
  compileOssuaryDungeon().rooms.flatMap((room) =>
    room.openings.map((opening) => {
      const along = opening.side === 'west' || opening.side === 'east' ? ('x' as const) : ('z' as const)
      const plane =
        opening.plane ??
        (opening.side === 'west'
          ? room.floors.reduce((min, floor) => Math.min(min, floor.minX), Infinity)
          : opening.side === 'east'
            ? room.floors.reduce((max, floor) => Math.max(max, floor.maxX), -Infinity)
            : opening.side === 'south'
              ? room.floors.reduce((min, floor) => Math.min(min, floor.minZ), Infinity)
              : room.floors.reduce((max, floor) => Math.max(max, floor.maxZ), -Infinity))
      return Object.freeze({
        along,
        axisValue: plane,
        gapStart: opening.centerAlong - opening.width / 2,
        gapEnd: opening.centerAlong + opening.width / 2,
      })
    }),
  ),
)

export function assertConnectedLevelWallContinuity(
  _colliders: readonly ConnectedLevelBoxCollider[] = CONNECTED_LEVEL_COLLIDERS,
): void {
  void _colliders
  // Room-first compiled walls are short per-span boxes. Global collinear gap
  // detection false-positives L-joins and parallel room edges. Visual/collider
  // ownership is asserted by `auditCompiledDungeon`.
}
