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
  // Slow restrained breath — no toy bounce / scale pulse.
  const breath = Math.sin(simulationStep * 0.028)
  const speed = Math.min(state.locomotionSpeed, PLAYER_MOVE_SPEED_REF)
  const locomotionCycle = simulationStep * (0.09 + speed * 0.022)

  switch (state.mode) {
    case 'defeated':
      return pose({
        bodyOffsetY: -0.32,
        bodyOffsetX: 0.06,
        bodyScaleY: 0.28,
        bodyScaleZ: 0.92,
        bodyRoll: Math.PI / 2.35,
        torsoPitch: 0.18,
        leftArmPitch: 0.35,
        rightArmPitch: -0.2,
        weaponPitch: 0.55,
        defeated: true,
      })
    case 'dodge':
      return pose({
        bodyOffsetX: 0.18,
        bodyOffsetY: -0.06,
        bodyScaleX: 0.92,
        bodyScaleY: 0.88,
        bodyScaleZ: 1.1,
        torsoPitch: 0.42,
        bodyRoll: -0.08,
        limbSwing: 0.55,
        leftArmPitch: 0.35,
        rightArmPitch: -0.55,
        weaponPitch: 0.2,
      })
    case 'guard':
      return pose({
        bodyOffsetY: breath * 0.003,
        bodyScaleZ: 1.02,
        torsoPitch: -0.16,
        bodyRoll: 0.04,
        leftArmPitch: -0.95,
        rightArmPitch: -0.72,
        weaponPitch: -0.48,
      })
    case 'heal': {
      const lift = phase === 'startup' ? progress : phase === 'active' ? 1 : 1 - progress * 0.85
      return pose({
        bodyOffsetY: breath * 0.002 - 0.01 * lift,
        torsoPitch: -0.12 * lift,
        leftArmPitch: -1.15 * lift,
        rightArmPitch: -0.35 * lift,
        weaponPitch: 0.55 * lift,
      })
    }
    case 'light-attack':
    case 'heavy-attack': {
      const heavy = state.mode === 'heavy-attack'
      const anticipation = phase === 'startup' ? progress : 0
      const strike = phase === 'active' ? Math.sin(progress * Math.PI) : 0
      const recovery = phase === 'recovery' ? 1 - progress : 0
      return pose({
        bodyOffsetY: -0.02 * anticipation - (heavy ? 0.04 : 0.015) * strike,
        torsoPitch:
          (heavy ? -0.48 : -0.18) * anticipation +
          (heavy ? 0.55 : 0.28) * strike +
          (heavy ? 0.2 : 0.08) * recovery,
        bodyRoll:
          (heavy ? -0.22 : -0.08) * anticipation + (heavy ? 0.28 : 0.12) * strike,
        leftArmPitch: -0.28 * anticipation + 0.5 * strike,
        rightArmPitch:
          (heavy ? -1.25 : -0.68) * anticipation + (heavy ? 1.35 : 0.98) * strike,
        weaponPitch:
          (heavy ? -0.55 : -0.2) * anticipation +
          (heavy ? 0.48 : 0.32) * strike +
          0.1 * recovery,
        limbSwing: 0.12 * strike,
      })
    }
    case 'hit-reaction':
      return pose({
        bodyOffsetX: -0.05,
        bodyOffsetY: -0.015,
        bodyRoll: -0.1,
        torsoPitch: -0.2,
        leftArmPitch: 0.22,
        rightArmPitch: 0.28,
        weaponPitch: 0.12,
      })
    case 'locomotion': {
      const stride =
        Math.sin(locomotionCycle) * Math.min(0.78, 0.2 + speed * 0.11)
      // Grounded vertical settle — avoid marching bounce.
      const settle = Math.abs(Math.sin(locomotionCycle)) * 0.008
      return pose({
        bodyOffsetY: settle,
        torsoPitch: 0.07 + speed * 0.008,
        limbSwing: stride,
        leftArmPitch: -stride * 0.72,
        rightArmPitch: stride * 0.72,
        weaponPitch: stride * 0.08,
      })
    }
    case 'idle':
      return pose({
        bodyOffsetY: breath * 0.004,
        torsoPitch: breath * 0.008,
        bodyRoll: breath * 0.004,
        leftArmPitch: -0.06 + breath * 0.01,
        rightArmPitch: 0.05 - breath * 0.008,
        weaponPitch: 0.04 + breath * 0.012,
      })
    case 'enemy-attack':
      return pose({})
  }
}

const PLAYER_MOVE_SPEED_REF = 4

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
