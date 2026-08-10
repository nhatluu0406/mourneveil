import type { EnemyAnimationPresentationDefinition } from '../../game/enemies/enemyRoles'
import type { AnimationPresentationState } from './animationPresentation'

export interface EnemyProceduralPose {
  readonly bodyOffsetY: number
  readonly bodyPitch: number
  readonly bodyRoll: number
  readonly bodyScaleY: number
  readonly weaponPitch: number
  readonly weaponYaw: number
}

export function resolveEnemyProceduralPose(
  state: AnimationPresentationState,
  tuning: EnemyAnimationPresentationDefinition,
  simulationStep: number,
): EnemyProceduralPose {
  const progress = state.action?.normalizedPhaseProgress ?? 0
  const phase = state.action?.phase ?? 'idle'

  switch (state.mode) {
    case 'defeated':
      return pose({ bodyOffsetY: -0.42, bodyRoll: Math.PI / 2, bodyScaleY: 0.2 })
    case 'hit-reaction':
      return pose({
        bodyPitch: -tuning.hitRecoil,
        bodyRoll: tuning.hitRecoil * 0.45,
        weaponPitch: tuning.hitRecoil * 0.6,
      })
    case 'locomotion': {
      const cycle = simulationStep * tuning.locomotionCadence
      return pose({
        bodyOffsetY: Math.abs(Math.sin(cycle)) * tuning.idleAmplitude * 1.35,
        bodyPitch: 0.08 + Math.sin(cycle) * 0.035,
        bodyRoll: Math.sin(cycle * 0.5) * 0.035,
        weaponPitch: Math.sin(cycle) * 0.12,
      })
    }
    case 'enemy-attack': {
      const anticipation = phase === 'startup' ? progress : 0
      const strike = phase === 'active' ? Math.sin(progress * Math.PI) : 0
      const recovery = phase === 'recovery' ? 1 - progress : 0
      return pose({
        bodyOffsetY: -0.035 * (anticipation + strike),
        bodyPitch: -tuning.attackAnticipation * anticipation +
          tuning.attackSwing * strike + tuning.recoveryWeight * recovery,
        bodyRoll: -tuning.attackAnticipation * 0.25 * anticipation +
          tuning.attackSwing * 0.28 * strike,
        weaponPitch: -tuning.attackAnticipation * anticipation +
          tuning.attackSwing * strike,
        weaponYaw: -tuning.attackSwing * 0.35 * anticipation +
          tuning.attackSwing * 0.7 * strike,
      })
    }
    case 'idle':
      return pose({
        bodyOffsetY: Math.sin(simulationStep * tuning.locomotionCadence * 0.35) *
          tuning.idleAmplitude,
        bodyPitch: Math.sin(simulationStep * 0.035) * tuning.idleAmplitude,
      })
    case 'guard':
    case 'dodge':
    case 'heal':
    case 'light-attack':
    case 'heavy-attack':
      return pose({})
  }
}

function pose(overrides: Partial<EnemyProceduralPose>): EnemyProceduralPose {
  return {
    bodyOffsetY: 0,
    bodyPitch: 0,
    bodyRoll: 0,
    bodyScaleY: 1,
    weaponPitch: 0,
    weaponYaw: 0,
    ...overrides,
  }
}
