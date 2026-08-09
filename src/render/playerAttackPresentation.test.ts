import { describe, expect, it } from 'vitest'
import { CombatActionRuntime } from '../game/combat/combatActionRuntime'
import {
  PLAYER_HEAVY_ATTACK,
  PLAYER_LIGHT_ATTACK,
} from '../game/combat/playerAttackActions'
import {
  computePlayerAttackPresentationPose,
  resolveAttackPresentationFacing,
} from './playerAttackPresentation'

describe('player attack presentation projection', () => {
  it('projects phases without controlling their progression', () => {
    const runtime = new CombatActionRuntime([PLAYER_LIGHT_ATTACK.action])
    expect(computePlayerAttackPresentationPose(runtime.snapshot())).toEqual({
      weaponVisible: true,
      weaponYawRadians: 0,
      weaponForwardOffset: -0.62,
      color: '#c4a574',
    })

    runtime.request({
      type: 'start-action',
      actionId: PLAYER_LIGHT_ATTACK.action.id,
    })
    const startup = computePlayerAttackPresentationPose(runtime.snapshot())
    expect(startup.weaponVisible).toBe(true)
    expect(startup.color).toBe('#d6c7a4')

    for (let step = 0; step < PLAYER_LIGHT_ATTACK.action.startupSteps; step += 1) {
      runtime.advanceFixedStep()
    }
    expect(computePlayerAttackPresentationPose(runtime.snapshot()).color).toBe(
      '#f4d06f',
    )
  })

  it('reads heavier commitment from heavy presentation without changing timings', () => {
    const light = new CombatActionRuntime([PLAYER_LIGHT_ATTACK.action])
    const heavy = new CombatActionRuntime([PLAYER_HEAVY_ATTACK.action])
    light.request({ type: 'start-action', actionId: PLAYER_LIGHT_ATTACK.action.id })
    heavy.request({ type: 'start-action', actionId: PLAYER_HEAVY_ATTACK.action.id })

    const lightStartup = computePlayerAttackPresentationPose(light.snapshot())
    const heavyStartup = computePlayerAttackPresentationPose(heavy.snapshot())
    expect(Math.abs(heavyStartup.weaponYawRadians)).toBeLessThanOrEqual(
      Math.abs(lightStartup.weaponYawRadians) + 0.01,
    )
    expect(heavyStartup.color).not.toBe(lightStartup.color)
  })

  it('prefers execution facing over live player facing', () => {
    expect(
      resolveAttackPresentationFacing(
        {
          movementConstrained: true,
          executionFacing: { x: 0, z: 1 },
          contactShapeId: PLAYER_LIGHT_ATTACK.contactShape.id,
          activeContactShape: null,
        },
        { facing: { x: 1, z: 0 } },
      ),
    ).toEqual({ x: 0, z: 1 })
  })
})
