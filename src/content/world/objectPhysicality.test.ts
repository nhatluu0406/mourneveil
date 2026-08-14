import { describe, expect, it } from 'vitest'
import { getWorldObjectDefinition } from './objects/catalog'
import { classifyWorldObjectPhysicality } from './objectPhysicality'

describe('world object physicality', () => {
  it('classifies substantial silhouettes with canonical collision as hard', () => {
    expect(classifyWorldObjectPhysicality(getWorldObjectDefinition('ossuary.wall.exterior'))).toBe('hard-physical')
    expect(classifyWorldObjectPhysicality(getWorldObjectDefinition('ossuary.light.brazier'))).toBe('hard-physical')
    expect(classifyWorldObjectPhysicality(getWorldObjectDefinition('ossuary.reliquary.broken'))).toBe('hard-physical')
  })

  it('keeps small dressing non-blocking and explicit veil effects non-physical', () => {
    expect(classifyWorldObjectPhysicality(getWorldObjectDefinition('ossuary.rubble.cluster'))).toBe('soft-dressing')
    expect(classifyWorldObjectPhysicality(getWorldObjectDefinition('ossuary.light.candle-cluster'))).toBe('soft-dressing')
    expect(classifyWorldObjectPhysicality(getWorldObjectDefinition('ossuary.wisp'))).toBe('vfx')
  })
})
