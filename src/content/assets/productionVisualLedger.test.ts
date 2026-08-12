import { describe, expect, it } from 'vitest'
import { PRODUCTION_VISUAL_ASSETS } from './productionVisualLedger'

describe('M10 production visual ledger', () => {
  it('keeps stable unique IDs and explicit ownership metadata', () => {
    const ids = PRODUCTION_VISUAL_ASSETS.map((asset) => asset.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const asset of PRODUCTION_VISUAL_ASSETS) {
      expect(asset.id).toMatch(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/)
      expect(asset.sourcePath).toMatch(/^src\/render\//)
      expect(asset.units).toBe('meters')
      expect(asset.upAxis).toBe('Y')
      expect(asset.pivot).toBe('ground-center')
      expect(asset.provenance).toContain('project-authored')
      expect(asset.license).toContain('Project-owned')
    }
  })
})
