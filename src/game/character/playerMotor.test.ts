import { describe, expect, it } from 'vitest'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import {
  PLAYER_MOVE_SPEED,
  createPlayerMotorState,
  stepPlayerMotor,
  type CharacterCollisionResolver,
  type PlayerMotorState,
} from './playerMotor'

const resolveOnFlatGround: CharacterCollisionResolver = (
  _position,
  desiredTranslation,
) => ({
  translation: { ...desiredTranslation, y: 0 },
  grounded: true,
})

function simulate(
  intent: PlayerMovementIntent,
  steps: number,
  initialState = createPlayerMotorState(),
): PlayerMotorState {
  let state = initialState
  for (let step = 0; step < steps; step += 1) {
    state = stepPlayerMotor(
      state,
      intent,
      FIXED_STEP_SECONDS,
      resolveOnFlatGround,
    )
  }
  return state
}

describe('player motor', () => {
  it('does not move horizontally under neutral intent', () => {
    const initial = createPlayerMotorState()
    const result = simulate({ horizontal: 0, forward: 0 }, 60, initial)

    expect(result.position.x).toBe(initial.position.x)
    expect(result.position.z).toBe(initial.position.z)
    expect(result.velocity).toEqual({ x: 0, y: 0, z: 0 })
    expect(result.grounded).toBe(true)
  })

  it('produces equivalent movement for equivalent fixed-step sequences', () => {
    const intent = { horizontal: 1, forward: 0 }

    expect(simulate(intent, 90)).toEqual(simulate(intent, 30 + 60))
  })

  it('keeps diagonal speed bounded by the movement speed', () => {
    const axis = simulate({ horizontal: 1, forward: 0 }, 60)
    const diagonal = simulate(
      { horizontal: Math.SQRT1_2, forward: Math.SQRT1_2 },
      60,
    )

    expect(Math.hypot(axis.velocity.x, axis.velocity.z)).toBeCloseTo(
      PLAYER_MOVE_SPEED,
    )
    expect(Math.hypot(diagonal.velocity.x, diagonal.velocity.z)).toBeCloseTo(
      PLAYER_MOVE_SPEED,
    )
  })

  it('accelerates and decelerates deterministically toward rest', () => {
    const accelerating = simulate({ horizontal: 1, forward: 0 }, 5)
    const slowing = simulate({ horizontal: 0, forward: 0 }, 5, accelerating)
    const stopped = simulate({ horizontal: 0, forward: 0 }, 10, slowing)

    expect(accelerating.velocity.x).toBeCloseTo(1.5)
    expect(slowing.velocity.x).toBeCloseTo(0)
    expect(stopped.velocity).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('uses collision-resolved translation as authoritative motion', () => {
    const blocked: CharacterCollisionResolver = () => ({
      translation: { x: 0, y: 0, z: 0 },
      grounded: true,
    })
    const initial = createPlayerMotorState()
    const result = stepPlayerMotor(
      initial,
      { horizontal: 1, forward: 0 },
      FIXED_STEP_SECONDS,
      blocked,
    )

    expect(result.position).toEqual(initial.position)
    expect(result.velocity).toEqual({ x: 0, y: 0, z: 0 })
  })
})
