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

  it('detects tall foreground masses on the true camera→focus cast', () => {
    const pillar = aabbFromCenterSize([2.5, 1.6, 2.5], [0.8, 3.2, 0.8])
    const camera = { x: 4, y: 8, z: 4 }
    const focus = { x: -2, y: 0.82, z: 0 }
    expect(occludingSolidIds(camera, focus, [{ id: 'pillar', box: pillar }])).toEqual(['pillar'])
  })

  it('fades neighboring divider bays that miss the thin ray but cover high-oblique view', () => {
    // Mirrors the PO divider case: player west of the court wall, camera southeast.
    const camera = { x: 3.24, y: 9.72, z: 2.9 }
    const focus = { x: -4.2, y: 1.37, z: -3.6 }
    const neighborBay = aabbFromCenterSize([-2.83, 0.88, -4.8], [0.71, 1.5, 1.75])
    const farBehind = aabbFromCenterSize([-2.83, 0.88, -6.4], [0.71, 1.5, 1.75])
    const northBay = aabbFromCenterSize([-3.28, 0.88, 1.8], [0.71, 1.5, 1.75])
    const ids = occludingSolidIds(camera, focus, [
      { id: 'bay.neighbor', box: neighborBay },
      { id: 'bay.far', box: farBehind },
      { id: 'bay.north', box: northBay },
    ])
    expect(ids).toContain('bay.neighbor')
    expect(ids).not.toContain('bay.far')
  })
})
