import { describe, expect, it } from 'vitest'
import { createPlayerMotorState } from '../character/playerMotor'
import { CombatActionRuntime } from '../combat/combatActionRuntime'
import { createPlayerAttackSpatialSnapshot } from '../combat/playerAttackActions'
import { CombatContactRuntime } from '../combat/combatContact'
import { TrainingTargetRuntime } from '../combat/trainingTarget'
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
      activeInputSource: 'keyboard' as const,
      player: createPlayerMotorState(),
      combat: new CombatActionRuntime([]).snapshot(),
      attack: createPlayerAttackSpatialSnapshot(
        new CombatActionRuntime([]).snapshot(),
        createPlayerMotorState().position,
        createPlayerMotorState().facing,
      ),
      contact: new CombatContactRuntime().snapshot(),
      trainingTarget: new TrainingTargetRuntime().snapshot(),
    }

    expect(createFoundationDiagnostic(true, false, runtime)).toEqual({
      workingTitle: 'Mourneveil',
      milestone: 'M2.3',
      rendererReady: true,
      physicsReady: false,
      foundationReady: false,
      runtime,
    })

    expect(createFoundationDiagnostic(true, true, runtime).foundationReady).toBe(true)
  })
})
