import { afterEach, describe, expect, it } from 'vitest'
import {
  resetPlayerLocomotionPresentation,
  tickPlayerLocomotionPresentation,
  plantedFootSwing,
} from './playerLocomotionPresentation'
import { resolvePlayerProceduralPose } from './playerProceduralPose'
import type { AnimationPresentationState } from './animationPresentation'

function walkState(): AnimationPresentationState {
  return {
    actorId: 'player',
    mode: 'locomotion',
    locomotionSpeed: 3,
    locomotionDirection: { x: 0, z: -1 },
    facing: { x: 0, z: -1 },
    action: null,
    hitReactionToken: null,
    transition: { blendSeconds: 0.1, defeatedOverride: false },
  }
}

describe('distance-driven player locomotion', () => {
  afterEach(() => {
    resetPlayerLocomotionPresentation()
  })

  it('does not advance gait while idle', () => {
    tickPlayerLocomotionPresentation({
      positionX: 0,
      positionZ: 0,
      facingX: 0,
      facingZ: -1,
      deltaSeconds: 1 / 60,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    const idle = tickPlayerLocomotionPresentation({
      positionX: 0,
      positionZ: 0,
      facingX: 0,
      facingZ: -1,
      deltaSeconds: 1 / 60,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    expect(idle.gaitPhase).toBe(0)
    expect(idle.mode).toBe('idle')
  })

  it('advances gait in proportion to travelled distance', () => {
    tickPlayerLocomotionPresentation({
      positionX: 0,
      positionZ: 0,
      facingX: 0,
      facingZ: -1,
      deltaSeconds: 1 / 60,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    const moved = tickPlayerLocomotionPresentation({
      positionX: 0,
      positionZ: -1.22,
      facingX: 0,
      facingZ: -1,
      deltaSeconds: 0.3,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    expect(moved.gaitPhase).toBeCloseTo(Math.PI * 2, 5)
    expect(moved.gaitAmplitude).toBeGreaterThan(0)
  })

  it('freezes gait when grounded displacement is blocked', () => {
    tickPlayerLocomotionPresentation({
      positionX: 0,
      positionZ: 0,
      facingX: 1,
      facingZ: 0,
      deltaSeconds: 1 / 60,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    tickPlayerLocomotionPresentation({
      positionX: 0.4,
      positionZ: 0,
      facingX: 1,
      facingZ: 0,
      deltaSeconds: 0.08,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    const blocked = tickPlayerLocomotionPresentation({
      positionX: 0.4,
      positionZ: 0,
      facingX: 1,
      facingZ: 0,
      deltaSeconds: 0.08,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    const phase = blocked.gaitPhase
    const still = tickPlayerLocomotionPresentation({
      positionX: 0.4,
      positionZ: 0,
      facingX: 1,
      facingZ: 0,
      deltaSeconds: 0.08,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    expect(still.gaitPhase).toBe(phase)
  })

  it('damps presentation yaw across a 180 turn instead of snapping', () => {
    tickPlayerLocomotionPresentation({
      positionX: 0,
      positionZ: 0,
      facingX: 0,
      facingZ: -1,
      deltaSeconds: 1 / 60,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    const turning = tickPlayerLocomotionPresentation({
      positionX: 0,
      positionZ: 0.02,
      facingX: 0,
      facingZ: 1,
      deltaSeconds: 1 / 60,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    const snapped = Math.atan2(-0, -1)
    expect(Math.abs(turning.yawRadians - snapped)).toBeGreaterThan(0.2)
  })

  it('resets gait across presentation teleports', () => {
    tickPlayerLocomotionPresentation({
      positionX: 0,
      positionZ: 0,
      facingX: 0,
      facingZ: -1,
      deltaSeconds: 1 / 60,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    tickPlayerLocomotionPresentation({
      positionX: 0,
      positionZ: -1.22,
      facingX: 0,
      facingZ: -1,
      deltaSeconds: 0.3,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    const teleported = tickPlayerLocomotionPresentation({
      positionX: 10,
      positionZ: 10,
      facingX: 0,
      facingZ: -1,
      deltaSeconds: 1 / 60,
      grounded: true,
      committedAttack: false,
      currentYawRadians: 0,
    })
    expect(teleported.gaitPhase).toBe(0)
    expect(teleported.mode).toBe('idle')
  })

  it('plants the stance foot and uses locomotion state in the procedural pose', () => {
    const plant = plantedFootSwing(Math.PI / 2, 1)
    expect(Math.abs(plant.left)).toBeGreaterThan(Math.abs(plant.right))
    const locomotion = {
      gaitPhase: Math.PI / 2,
      gaitAmplitude: 1,
      planarSpeed: 3,
      mode: 'walk' as const,
      grounded: true,
      yawRadians: 0,
    }
    const pose = resolvePlayerProceduralPose(walkState(), 40, locomotion)
    expect(pose.leftLimbSwing).not.toBe(pose.rightLimbSwing)
    const idlePose = resolvePlayerProceduralPose({ ...walkState(), mode: 'idle', locomotionSpeed: 0 }, 40, {
      ...locomotion,
      gaitAmplitude: 0,
      mode: 'idle',
    })
    expect(idlePose.limbSwing).toBe(0)
  })
})
