import { describe, expect, it } from 'vitest'
import { createFoundationDiagnostic } from './foundationDiagnostic'

describe('createFoundationDiagnostic', () => {
  it('reports foundation readiness only after renderer and physics are ready', () => {
    expect(createFoundationDiagnostic(true, false)).toEqual({
      workingTitle: 'Mourneveil',
      milestone: 'M0',
      rendererReady: true,
      physicsReady: false,
      foundationReady: false,
    })

    expect(createFoundationDiagnostic(true, true).foundationReady).toBe(true)
  })
})
