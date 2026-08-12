import { describe, expect, it } from 'vitest'
import { OSSUARY_ROUTE_PLACEMENTS } from './ossuary/routePlacements'
import {
  listFadeOcclusionSolids,
  rebuildFadeOcclusionSolids,
  setOccludedPlacementIds,
  isPlacementOccluded,
} from './occlusionPlacementState'
import { resolveWorldObjectDefinition } from './worldObjectRegistry'

describe('occlusion placement state', () => {
  it('indexes fade-eligible architecture placements with stable instance IDs', () => {
    rebuildFadeOcclusionSolids(OSSUARY_ROUTE_PLACEMENTS)
    const solids = listFadeOcclusionSolids()
    expect(solids.length).toBeGreaterThan(10)
    expect(solids.every((entry) => typeof entry.id === 'string')).toBe(true)
    const bay = solids.find((entry) => entry.id.startsWith('bay.'))
    expect(bay).toBeDefined()
  })

  it('tracks occluded placement IDs without mutating definitions', () => {
    setOccludedPlacementIds(new Set(['bay.watch.0']))
    expect(isPlacementOccluded('bay.watch.0')).toBe(true)
    expect(isPlacementOccluded('bay.watch.1')).toBe(false)
    expect(resolveWorldObjectDefinition('ossuary.wall.bay').occlusionPolicy).toBe('fade')
    expect(resolveWorldObjectDefinition('ossuary.floor.slab').occlusionPolicy).not.toBe('fade')
  })
})
