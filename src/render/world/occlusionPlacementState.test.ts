import { describe, expect, it } from 'vitest'
import { OSSUARY_ROUTE_PLACEMENTS } from './ossuary/routePlacements'
import {
  listFadeOcclusionSolids,
  rebuildFadeOcclusionSolids,
  setOccludedPlacementIds,
  isPlacementOccluded,
} from './occlusionPlacementState'
import { resolveWorldObjectDefinition } from './worldObjectRegistry'
import { ALLOWED_OCCLUSION_FADE_IDS } from '../allowedOcclusionFade'

describe('occlusion placement state', () => {
  it('indexes only authored gates as fade-eligible', () => {
    rebuildFadeOcclusionSolids(OSSUARY_ROUTE_PLACEMENTS)
    expect(listFadeOcclusionSolids().map((entry) => entry.id).sort()).toEqual(['gate.final', 'gate.shortcut'])
    expect(
      OSSUARY_ROUTE_PLACEMENTS.filter(
        (entry) => resolveWorldObjectDefinition(entry.objectId).occlusionPolicy === 'fade',
      ).map((entry) => entry.instanceId).sort(),
    ).toEqual(['gate.final', 'gate.shortcut'])
    expect(ALLOWED_OCCLUSION_FADE_IDS).toEqual(['gate.shortcut', 'gate.final'])
  })

  it('tracks occluded placement IDs without mutating definitions', () => {
    setOccludedPlacementIds(new Set(['bay.watch.0']))
    expect(isPlacementOccluded('bay.watch.0')).toBe(true)
    expect(isPlacementOccluded('bay.watch.1')).toBe(false)
    expect(resolveWorldObjectDefinition('ossuary.wall.bay').occlusionPolicy).not.toBe('fade')
  })
})
