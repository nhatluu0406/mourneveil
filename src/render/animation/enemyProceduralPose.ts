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
  const aggressiveLean = tuning.locomotionCadence > 0.14 ? 0.12 : 0.04

  switch (state.mode) {
    case 'defeated':
      return pose({
        bodyOffsetY: -0.36,
        bodyRoll: Math.PI / 2.2,
        bodyScaleY: 0.26,
        bodyPitch: 0.12,
        weaponPitch: 0.4,
      })
    case 'hit-reaction':
      return pose({
        bodyPitch: -tuning.hitRecoil,
        bodyRoll: tuning.hitRecoil * 0.4,
        bodyOffsetY: -0.02,
        weaponPitch: tuning.hitRecoil * 0.55,
      })
    case 'locomotion': {
      const cycle = simulationStep * tuning.locomotionCadence
      const stride = Math.sin(cycle)
      return pose({
        // Planted cadence — avoid abs(sin) toy bounce.
        bodyOffsetY: Math.abs(stride) * tuning.idleAmplitude * 0.55,
        bodyPitch: aggressiveLean + stride * 0.03,
        bodyRoll: stride * (tuning.locomotionCadence > 0.14 ? 0.045 : 0.02),
        weaponPitch: stride * (tuning.locomotionCadence > 0.14 ? 0.16 : 0.08),
      })
    }
    case 'enemy-attack': {
      const anticipation = phase === 'startup' ? progress : 0
      const strike = phase === 'active' ? Math.sin(progress * Math.PI) : 0
      const recovery = phase === 'recovery' ? 1 - progress : 0
      // Recovery leans back and opens the guard line; startup coils opposite the strike.
      return pose({
        bodyOffsetY: -0.05 * anticipation - 0.06 * strike + 0.03 * recovery,
        bodyPitch:
          -tuning.attackAnticipation * anticipation +
          tuning.attackSwing * strike +
          tuning.recoveryWeight * recovery,
        bodyRoll:
          -tuning.attackAnticipation * 0.35 * anticipation +
          tuning.attackSwing * 0.34 * strike -
          tuning.recoveryWeight * 0.18 * recovery,
        bodyScaleY: 1 - 0.04 * anticipation + 0.06 * strike - 0.05 * recovery,
        weaponPitch:
          -tuning.attackAnticipation * 1.15 * anticipation +
          tuning.attackSwing * strike +
          tuning.recoveryWeight * 0.55 * recovery,
        weaponYaw:
          -tuning.attackSwing * 0.45 * anticipation +
          tuning.attackSwing * 0.8 * strike -
          tuning.recoveryWeight * 0.25 * recovery,
      })
    }
    case 'idle':
      return pose({
        bodyOffsetY:
          Math.sin(simulationStep * tuning.locomotionCadence * 0.22) *
          tuning.idleAmplitude *
          0.65,
        bodyPitch: aggressiveLean * 0.35 + Math.sin(simulationStep * 0.025) * tuning.idleAmplitude,
        weaponPitch: Math.sin(simulationStep * 0.02) * tuning.idleAmplitude * 0.8,
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
