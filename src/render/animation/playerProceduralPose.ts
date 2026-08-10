import type { AnimationPresentationState } from './animationPresentation'

export interface PlayerProceduralPose {
  readonly bodyOffsetX: number
  readonly bodyOffsetY: number
  readonly bodyScaleX: number
  readonly bodyScaleY: number
  readonly bodyScaleZ: number
  readonly bodyRoll: number
  readonly torsoPitch: number
  readonly limbSwing: number
  readonly leftArmPitch: number
  readonly rightArmPitch: number
  readonly weaponPitch: number
  readonly defeated: boolean
}

/** Pure procedural backend; simulation step is the only cadence input. */
export function resolvePlayerProceduralPose(
  state: AnimationPresentationState,
  simulationStep: number,
): PlayerProceduralPose {
  const progress = state.action?.normalizedPhaseProgress ?? 0
  const phase = state.action?.phase ?? 'idle'
  const breath = Math.sin(simulationStep * 0.045)
  const locomotionCycle = simulationStep * (0.11 + Math.min(state.locomotionSpeed, 5) * 0.025)

  switch (state.mode) {
    case 'defeated':
      return pose({
        bodyOffsetY: -0.38,
        bodyScaleY: 0.2,
        bodyRoll: Math.PI / 2,
        torsoPitch: 0.25,
        defeated: true,
      })
    case 'dodge':
      return pose({
        bodyOffsetX: 0.14,
        bodyOffsetY: -0.04,
        bodyScaleX: 0.94,
        bodyScaleY: 0.9,
        bodyScaleZ: 1.06,
        torsoPitch: 0.34,
        limbSwing: 0.45,
      })
    case 'guard':
      return pose({
        bodyOffsetY: breath * 0.006,
        torsoPitch: -0.12,
        leftArmPitch: -0.8,
        rightArmPitch: -0.55,
        weaponPitch: -0.35,
      })
    case 'heal': {
      const lift = phase === 'startup' ? progress : phase === 'active' ? 1 : 1 - progress
      return pose({
        bodyOffsetY: breath * 0.004,
        torsoPitch: -0.08 * lift,
        leftArmPitch: -1.25 * lift,
        rightArmPitch: -1.05 * lift,
        weaponPitch: 0.7 * lift,
      })
    }
    case 'light-attack':
    case 'heavy-attack': {
      const heavy = state.mode === 'heavy-attack'
      const anticipation = phase === 'startup' ? progress : 0
      const strike = phase === 'active' ? Math.sin(progress * Math.PI) : 0
      const recovery = phase === 'recovery' ? 1 - progress : 0
      return pose({
        bodyOffsetY: -0.025 * (anticipation + strike),
        torsoPitch: (heavy ? -0.35 : -0.2) * anticipation +
          (heavy ? 0.42 : 0.26) * strike + 0.12 * recovery,
        bodyRoll: (heavy ? -0.18 : -0.1) * anticipation +
          (heavy ? 0.22 : 0.14) * strike,
        leftArmPitch: -0.35 * anticipation + 0.45 * strike,
        rightArmPitch: (heavy ? -1.05 : -0.72) * anticipation +
          (heavy ? 1.2 : 0.92) * strike,
        weaponPitch: (heavy ? -0.42 : -0.24) * anticipation +
          (heavy ? 0.35 : 0.2) * strike,
      })
    }
    case 'hit-reaction':
      return pose({
        bodyOffsetX: -0.06,
        bodyRoll: -0.12,
        torsoPitch: -0.24,
        leftArmPitch: 0.3,
        rightArmPitch: 0.38,
      })
    case 'locomotion': {
      const stride = Math.sin(locomotionCycle) * Math.min(0.72, 0.16 + state.locomotionSpeed * 0.1)
      return pose({
        bodyOffsetY: Math.abs(Math.sin(locomotionCycle)) * 0.018,
        torsoPitch: 0.09,
        limbSwing: stride,
        leftArmPitch: -stride * 0.65,
        rightArmPitch: stride * 0.65,
      })
    }
    case 'idle':
      return pose({
        bodyOffsetY: breath * 0.008,
        bodyScaleY: 1 + breath * 0.006,
        torsoPitch: breath * 0.012,
        leftArmPitch: -0.05 + breath * 0.015,
        rightArmPitch: 0.04 - breath * 0.012,
        weaponPitch: 0.05 + breath * 0.01,
      })
    case 'enemy-attack':
      return pose({})
  }
}

function pose(overrides: Partial<PlayerProceduralPose>): PlayerProceduralPose {
  return {
    bodyOffsetX: 0,
    bodyOffsetY: 0,
    bodyScaleX: 1,
    bodyScaleY: 1,
    bodyScaleZ: 1,
    bodyRoll: 0,
    torsoPitch: 0,
    limbSwing: 0,
    leftArmPitch: 0,
    rightArmPitch: 0,
    weaponPitch: 0,
    defeated: false,
    ...overrides,
  }
}
