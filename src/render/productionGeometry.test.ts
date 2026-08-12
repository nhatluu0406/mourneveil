import { describe, expect, it } from 'vitest'
import {
  createOathbladeGeometry,
  createGravebrandGeometry,
  createVeilThornGeometry,
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

  it('gives all three weapons compact, unmistakably different silhouettes', () => {
    const oath = createOathbladeGeometry().boundingBox!
    const grave = createGravebrandGeometry().boundingBox!
    const thorn = createVeilThornGeometry().boundingBox!
    expect(grave.max.x - grave.min.x).toBeGreaterThan((oath.max.x - oath.min.x) * 1.8)
    expect(thorn.max.x - thorn.min.x).toBeLessThan(oath.max.x - oath.min.x)
    expect(thorn.min.z).toBeGreaterThanOrEqual(-0.72)
    expect(grave.min.z).toBeGreaterThanOrEqual(-0.6)
  })
})
