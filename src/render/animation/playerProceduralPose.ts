import type { AnimationPresentationState } from './animationPresentation'
import { SKILL_OATH_CLEAVE_ID, SKILL_VEIL_STEP_ID, SKILL_WARD_PULSE_ID } from '../../game/skills/skillDefinition'
import {
  plantedFootSwing,
  type PlayerLocomotionPresentation,
} from './playerLocomotionPresentation'

export interface PlayerProceduralPose {
  readonly bodyOffsetX: number
  readonly bodyOffsetY: number
  readonly bodyScaleX: number
  readonly bodyScaleY: number
  readonly bodyScaleZ: number
  readonly bodyRoll: number
  readonly torsoPitch: number
  readonly limbSwing: number
  readonly leftLimbSwing: number
  readonly rightLimbSwing: number
  readonly leftArmPitch: number
  readonly rightArmPitch: number
  readonly weaponPitch: number
  readonly defeated: boolean
}

/** Pure procedural backend. Locomotion gait is distance-driven presentation state. */
export function resolvePlayerProceduralPose(
  state: AnimationPresentationState,
  simulationStep: number,
  locomotion: PlayerLocomotionPresentation | null = null,
): PlayerProceduralPose {
  const progress = state.action?.normalizedPhaseProgress ?? 0
  const phase = state.action?.phase ?? 'idle'
  // Slow restrained breath — no toy bounce / scale pulse.
  const breath = Math.sin(simulationStep * 0.028)
  const speed = Math.min(state.locomotionSpeed, PLAYER_MOVE_SPEED_REF)
  const timeCycle = simulationStep * (0.09 + speed * 0.022)

  if (state.action?.actionId === SKILL_VEIL_STEP_ID) {
    const compression = phase === 'startup' ? progress : phase === 'active' ? 1 - progress * 0.35 : 0.65 * (1 - progress)
    return pose({ bodyOffsetX: -0.12 * compression, bodyOffsetY: -0.08 * compression, bodyScaleX: 0.88, bodyScaleZ: 1.16, torsoPitch: 0.5 * compression, bodyRoll: -0.18 * compression, limbSwing: 0.62, leftArmPitch: 0.5, rightArmPitch: -0.72, weaponPitch: 0.28 })
  }
  if (state.action?.actionId === SKILL_OATH_CLEAVE_ID) {
    const coil = phase === 'startup' ? progress : 0
    const release = phase === 'active' ? Math.sin(progress * Math.PI) : 0
    const settle = phase === 'recovery' ? 1 - progress : 0
    return pose({ bodyOffsetY: -0.06 * coil - 0.08 * release, bodyScaleX: 1 + 0.08 * release, bodyScaleZ: 1.1 - 0.08 * release, torsoPitch: -0.78 * coil + 0.92 * release + 0.28 * settle, bodyRoll: -0.42 * coil + 0.52 * release, leftArmPitch: -0.58 * coil + 0.72 * release, rightArmPitch: -1.62 * coil + 1.82 * release, weaponPitch: -0.95 * coil + 0.88 * release })
  }
  if (state.action?.actionId === SKILL_WARD_PULSE_ID) {
    const brace = phase === 'startup' ? progress : phase === 'active' ? 1 : 1 - progress
    return pose({ bodyOffsetY: -0.035 * brace, bodyScaleX: 1.08, bodyScaleZ: 1.05, torsoPitch: -0.24 * brace, leftArmPitch: -1.28 * brace, rightArmPitch: -1.05 * brace, weaponPitch: -0.3 * brace })
  }

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
      // Stronger silhouette commitment: coil → committed swing → open recover.
      return pose({
        bodyOffsetY:
          -0.03 * anticipation -
          (heavy ? 0.055 : 0.022) * strike +
          0.012 * recovery,
        bodyScaleY: 1 - (heavy ? 0.04 : 0.02) * anticipation + (heavy ? 0.05 : 0.03) * strike,
        bodyScaleZ: 1 + (heavy ? 0.06 : 0.03) * anticipation - (heavy ? 0.04 : 0.02) * strike,
        torsoPitch:
          (heavy ? -0.62 : -0.28) * anticipation +
          (heavy ? 0.72 : 0.38) * strike +
          (heavy ? 0.28 : 0.14) * recovery,
        bodyRoll:
          (heavy ? -0.3 : -0.12) * anticipation +
          (heavy ? 0.36 : 0.16) * strike -
          (heavy ? 0.1 : 0.05) * recovery,
        leftArmPitch: -0.4 * anticipation + 0.62 * strike + 0.12 * recovery,
        rightArmPitch:
          (heavy ? -1.45 : -0.88) * anticipation +
          (heavy ? 1.55 : 1.15) * strike +
          (heavy ? 0.25 : 0.12) * recovery,
        weaponPitch:
          (heavy ? -0.78 : -0.35) * anticipation +
          (heavy ? 0.72 : 0.48) * strike +
          (heavy ? 0.22 : 0.14) * recovery,
        limbSwing: (heavy ? 0.2 : 0.14) * strike,
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
      const gait = locomotion ?? {
        gaitPhase: timeCycle,
        gaitAmplitude: 1,
        planarSpeed: speed,
        mode: 'walk' as const,
        grounded: true,
        yawRadians: 0,
      }
      const plant = plantedFootSwing(
        gait.gaitPhase,
        gait.gaitAmplitude * Math.min(0.78, 0.2 + speed * 0.11),
      )
      return pose({
        bodyOffsetY: plant.pelvisY,
        torsoPitch: 0.07 + speed * 0.008,
        bodyOffsetX: plant.left * 0.02,
        bodyRoll: plant.left * 0.04,
        limbSwing: plant.left,
        leftLimbSwing: plant.left,
        rightLimbSwing: plant.right,
        leftArmPitch: -plant.right * 0.72,
        rightArmPitch: -plant.left * 0.72,
        weaponPitch: plant.left * 0.08,
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
  const limbSwing = overrides.limbSwing ?? 0
  return {
    bodyOffsetX: overrides.bodyOffsetX ?? 0,
    bodyOffsetY: overrides.bodyOffsetY ?? 0,
    bodyScaleX: overrides.bodyScaleX ?? 1,
    bodyScaleY: overrides.bodyScaleY ?? 1,
    bodyScaleZ: overrides.bodyScaleZ ?? 1,
    bodyRoll: overrides.bodyRoll ?? 0,
    torsoPitch: overrides.torsoPitch ?? 0,
    limbSwing,
    leftLimbSwing: overrides.leftLimbSwing ?? limbSwing,
    rightLimbSwing: overrides.rightLimbSwing ?? -limbSwing,
    leftArmPitch: overrides.leftArmPitch ?? 0,
    rightArmPitch: overrides.rightArmPitch ?? 0,
    weaponPitch: overrides.weaponPitch ?? 0,
    defeated: overrides.defeated ?? false,
  }
}
