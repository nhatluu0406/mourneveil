import { describe, expect, it } from 'vitest'
import { resolveWorldObjectDefinition } from './worldObjectRegistry'
import { castsDynamicWorldShadow } from './worldShadowPolicy'

describe('static world shadow policy', () => {
  it('keeps ordinary architecture and small fixtures out of the dynamic shadow map', () => {
    expect(castsDynamicWorldShadow(resolveWorldObjectDefinition('ossuary.wall.bay'))).toBe(false)
    expect(castsDynamicWorldShadow(resolveWorldObjectDefinition('ossuary.light.wall-sconce'))).toBe(false)
  })

  it('allows explicitly authored major landmarks only', () => {
    expect(castsDynamicWorldShadow(resolveWorldObjectDefinition('ossuary.landmark.veil-monolith'))).toBe(true)
  })
})
