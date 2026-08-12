import { describe, expect, it } from 'vitest'
import {
  UnknownWorldObjectIdError,
  groupPlacementsByObjectId,
  listRegisteredWorldObjectIds,
  placementTransformMatrixInputs,
  resolveInstancedWorldObject,
  resolveWorldObjectDefinition,
} from './worldObjectRegistry'
import type { WorldObjectPlacement } from './worldObjectTypes'
import { OSSUARY_OBJECT_DEFINITIONS } from './ossuary/definitions'

describe('world object registry', () => {
  it('resolves registered definitions immutably', () => {
    const definition = resolveWorldObjectDefinition('ossuary.arch.full')
    expect(definition.id).toBe('ossuary.arch.full')
    expect(definition.family).toBe('architecture')
    expect(definition.renderMode).toBe('instanced')
    expect(Object.isFrozen(OSSUARY_OBJECT_DEFINITIONS)).toBe(true)
    expect(Object.isFrozen(definition)).toBe(true)
  })

  it('fails clearly for unknown object IDs', () => {
    expect(() => resolveWorldObjectDefinition('ossuary.not-a-thing')).toThrow(
      UnknownWorldObjectIdError,
    )
    expect(() => resolveWorldObjectDefinition('ossuary.not-a-thing')).toThrow(
      /Unknown world object id/,
    )
  })

  it('resolves instanced geometry and shared material for renderable types', () => {
    const resolved = resolveInstancedWorldObject('ossuary.marker.body')
    expect(resolved.geometry).toBeTruthy()
    expect(resolved.material).toBeTruthy()
    expect(resolved.definition.materialKey).toBe('darkStone')
  })

  it('rejects unique landmarks as instanced resolutions', () => {
    expect(() => resolveInstancedWorldObject('ossuary.landmark.veil-monolith')).toThrow(
      /not instanced/,
    )
  })

  it('groups placements by object id and applies default scale', () => {
    const placements = [
      {
        instanceId: 'arch.a',
        objectId: 'ossuary.arch.full',
        area: 'corridor',
        position: [-7.78, 1.55, 1.05],
        rotation: [0, -0.62, 0],
      },
      {
        instanceId: 'arch.b',
        objectId: 'ossuary.arch.full',
        area: 'corridor',
        position: [-8.7, 1.55, 2.45],
        rotation: [0, -0.62, 0],
        scale: [1.1, 1, 1.1],
      },
      {
        instanceId: 'marker.a',
        objectId: 'ossuary.marker.body',
        area: 'refuge',
        position: [-7.6, 0.36, -1.72],
        rotation: [0, 0.12, 0],
      },
    ] as const satisfies readonly WorldObjectPlacement[]

    const groups = groupPlacementsByObjectId(placements)
    expect(groups.get('ossuary.arch.full')?.length).toBe(2)
    expect(groups.get('ossuary.marker.body')?.length).toBe(1)

    const defaulted = placementTransformMatrixInputs(placements[0])
    expect(defaulted.scale).toEqual([1, 1, 1])
    const overridden = placementTransformMatrixInputs(placements[1])
    expect(overridden.scale).toEqual([1.1, 1, 1.1])
  })

  it('lists every registered object id exactly once', () => {
    const ids = listRegisteredWorldObjectIds()
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('ossuary.floor.slab')
    expect(ids).toContain('ossuary.landmark.veil-monolith')
  })
})
