import { describe, expect, it } from 'vitest'
import { createFoundationDiagnostic } from './foundationDiagnostic'

describe('createFoundationDiagnostic', () => {
  it('reports foundation readiness only after renderer and physics are ready', () => {
    const runtime = {
      simulation: {
        stepCount: 12,
        simulationTimeSeconds: 0.2,
        accumulatorSeconds: 0,
      },
      movementIntent: { horizontal: 0, forward: 1 },
    }

    expect(createFoundationDiagnostic(true, false, runtime)).toEqual({
      workingTitle: 'Mourneveil',
      milestone: 'M1.1',
      rendererReady: true,
      physicsReady: false,
      foundationReady: false,
      runtime,
    })

    expect(createFoundationDiagnostic(true, true, runtime).foundationReady).toBe(true)
  })
})
