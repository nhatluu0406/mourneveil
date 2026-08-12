import { describe, expect, it } from 'vitest'
import {
  createOathbladeGeometry,
  createProfilePrismGeometry,
  createTaperedPrismGeometry,
} from './productionGeometry'

describe('project-authored production geometry', () => {
  it('creates a finite tapered Y-up form', () => {
    const geometry = createTaperedPrismGeometry({
      bottomWidth: 0.5,
      topWidth: 0.35,
      height: 0.8,
      depth: 0.3,
    })
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-0.4)
    expect(geometry.boundingBox?.max.y).toBeCloseTo(0.4)
    expect(geometry.getAttribute('normal').count).toBeGreaterThan(0)
  })

  it('rejects an invalid authored profile', () => {
    expect(() => createProfilePrismGeometry([[0, 0], [1, 0]], 0.1)).toThrow(
      'at least three points',
    )
  })

  it('keeps the Oathblade compact and forward-readable', () => {
    const blade = createOathbladeGeometry()
    expect(blade.boundingBox?.min.z).toBeCloseTo(-0.62)
    expect(blade.boundingBox?.max.z).toBeCloseTo(0.05)
    expect((blade.boundingBox?.max.x ?? 0) - (blade.boundingBox?.min.x ?? 0)).toBeLessThan(0.2)
  })
})
