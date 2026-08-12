import { describe, expect, it } from 'vitest'
import {
  PRACTICAL_FIXTURE_GEOMETRIES,
  PRACTICAL_FLAME_GEO,
  PRACTICAL_FLAME_VEIL,
  PRACTICAL_FLAME_WARM,
  PRACTICAL_GLOW_GEO,
  PRACTICAL_GLOW_VEIL,
  PRACTICAL_GLOW_WARM,
} from './practicalLightGeometries'
import { getOssuaryMaterial } from '../materials'

describe('practical light geometries', () => {
  it('shares one merged geometry set for fixture metal bodies', () => {
    expect(PRACTICAL_FIXTURE_GEOMETRIES.sconceIron.getAttribute('position').count).toBeGreaterThan(8)
    expect(PRACTICAL_FIXTURE_GEOMETRIES.brazierIron.getAttribute('position').count).toBeGreaterThan(16)
    expect(PRACTICAL_FIXTURE_GEOMETRIES.candleClusterBone.getAttribute('position').count).toBeGreaterThan(12)
    expect(PRACTICAL_FIXTURE_GEOMETRIES.candleClusterFlame.getAttribute('position').count).toBeGreaterThan(8)
  })

  it('reuses ossuary emissive presets for flame cues', () => {
    expect(PRACTICAL_FLAME_WARM).toBe(getOssuaryMaterial('ember'))
    expect(PRACTICAL_FLAME_VEIL).toBe(getOssuaryMaterial('veil'))
    expect(PRACTICAL_GLOW_WARM).not.toBe(PRACTICAL_GLOW_VEIL)
    expect(PRACTICAL_FLAME_GEO).toBeTruthy()
    expect(PRACTICAL_GLOW_GEO).toBeTruthy()
  })
})
