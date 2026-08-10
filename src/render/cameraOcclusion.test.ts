import { describe, expect, it } from 'vitest'
import {
  aabbFromCenterSize,
  occludingSolidIds,
  readabilityOcclusionOrigin,
  segmentIntersectsAabb,
} from './cameraOcclusion'

describe('camera occlusion helpers', () => {
  it('detects a wall AABB on the readability probe between camera XZ and player', () => {
    const wall = aabbFromCenterSize([0, 0.75, 0], [0.5, 1.5, 4])
    const camera = { x: 4, y: 8, z: 4 }
    const focus = { x: -2, y: 0.82, z: 0 }
    const origin = readabilityOcclusionOrigin(camera, focus)
    expect(segmentIntersectsAabb(origin, focus, wall)).toBe(true)
  })

  it('ignores solids that do not intersect the readability segment', () => {
    const wall = aabbFromCenterSize([12, 0.75, 0], [0.5, 1.5, 4])
    const camera = { x: 4, y: 8, z: 4 }
    const focus = { x: -2, y: 0.82, z: 0 }
    expect(
      segmentIntersectsAabb(readabilityOcclusionOrigin(camera, focus), focus, wall),
    ).toBe(false)
  })

  it('returns only occluding solid IDs', () => {
    const solids = [
      { id: 'wall.a', box: aabbFromCenterSize([0, 0.75, 0], [0.5, 1.5, 4]) },
      { id: 'wall.b', box: aabbFromCenterSize([12, 0.75, 0], [0.5, 1.5, 4]) },
    ]
    expect(
      occludingSolidIds({ x: 4, y: 8, z: 4 }, { x: -2, y: 0.82, z: 0 }, solids),
    ).toEqual(['wall.a'])
  })
})
