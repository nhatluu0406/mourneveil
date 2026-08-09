import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../game/runtime/GameRuntime'
import { createDevelopmentDiagnostic } from './developmentDiagnostic'

describe('createDevelopmentDiagnostic', () => {
  it('reports runtime readiness only after renderer and physics are ready', () => {
    const runtime = {
      ...new GameRuntime().snapshot(),
      movementIntent: { horizontal: 0, forward: 1 },
      activeInputSource: 'keyboard' as const,
      combatInput: {
        primaryButtonHeld: false,
        guardHeld: false,
        dodgeKeyHeld: false,
        checkpointKeyHeld: false,
        respawnKeyHeld: false,
        flaskKeyHeld: false,
        pendingAttack: false,
        pendingDodge: false,
        pendingCheckpointInteraction: false,
        pendingRespawn: false,
        pendingFlaskUse: false,
      },
    }

    expect(createDevelopmentDiagnostic(true, false, runtime)).toEqual({
      workingTitle: 'Mourneveil',
      milestone: 'M5 Connected Level',
      rendererReady: true,
      physicsReady: false,
      runtimeReady: false,
      runtime,
    })

    expect(createDevelopmentDiagnostic(true, true, runtime).runtimeReady).toBe(true)
  })
})
