import { describe, expect, it } from 'vitest'
import { PlayerRuntime } from '../character/playerRuntime'
import { createFoundationDiagnostic } from './foundationDiagnostic'

describe('createFoundationDiagnostic', () => {
  it('reports foundation readiness only after renderer and physics are ready', () => {
    const runtime = {
      ...new PlayerRuntime().snapshot(),
      movementIntent: { horizontal: 0, forward: 1 },
      activeInputSource: 'keyboard' as const,
      combatInput: {
        primaryButtonHeld: false,
        guardHeld: false,
        dodgeKeyHeld: false,
        pendingAttack: false,
        pendingDodge: false,
      },
    }

    expect(createFoundationDiagnostic(true, false, runtime)).toEqual({
      workingTitle: 'Mourneveil',
      milestone: 'M3.4',
      rendererReady: true,
      physicsReady: false,
      foundationReady: false,
      runtime,
    })

    expect(createFoundationDiagnostic(true, true, runtime).foundationReady).toBe(true)
  })
})
