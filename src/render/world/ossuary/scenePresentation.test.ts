import { describe, expect, it } from 'vitest'
import { OSSUARY_ROUTE_PLACEMENTS } from './routePlacements'
import {
  activeRouteAreas,
  auditScenePlacements,
  classifyPropAnchor,
  filterPlacementsForZone,
} from './scenePresentation'

describe('scene presentation activation', () => {
  it('keeps neighbor rooms plus perimeter for the refuge camera', () => {
    const areas = activeRouteAreas('zone.checkpoint', true)
    expect(areas).toContain('refuge')
    expect(areas).toContain('corridor')
    expect(areas).toContain('mixed-court')
    expect(areas).toContain('perimeter')
    expect(areas).not.toContain('final-arena')
  })

  it('mounts every placement when culling is disabled', () => {
    expect(filterPlacementsForZone(OSSUARY_ROUTE_PLACEMENTS, 'zone.checkpoint', false)).toHaveLength(
      OSSUARY_ROUTE_PLACEMENTS.length,
    )
    const culled = filterPlacementsForZone(OSSUARY_ROUTE_PLACEMENTS, 'zone.checkpoint', true)
    expect(culled.length).toBeLessThan(OSSUARY_ROUTE_PLACEMENTS.length)
    expect(culled.length).toBeGreaterThan(80)
  })

  it('classifies wisps as intentional veil floaters and produces a family breakdown', () => {
    expect(classifyPropAnchor({
      instanceId: 'wisp.0',
      objectId: 'ossuary.wisp',
      area: 'refuge',
      position: [-4.55, 1.3, 1.2],
      rotation: [0, 0, 0],
    })).toBe('intentionally-floating')
    const audit = auditScenePlacements()
    expect(audit.total).toBe(OSSUARY_ROUTE_PLACEMENTS.length)
    expect(audit.byFamily.floor).toBeGreaterThan(50)
    expect(audit.byFamily.arches).toBeGreaterThan(5)
    expect(audit.suspiciousUnsupported).toEqual([])
  })
})
