import { describe, expect, it } from 'vitest'
import { CombatActionRuntime } from '../game/combat/combatActionRuntime'
import { PLAYER_LIGHT_ATTACK } from '../game/combat/playerAttackActions'
import { computePlayerAttackPresentationPose } from './playerAttackPresentation'

describe('player attack presentation projection', () => {
  it('projects phases without controlling their progression', () => {
    const runtime = new CombatActionRuntime([PLAYER_LIGHT_ATTACK.action])
    expect(computePlayerAttackPresentationPose(runtime.snapshot())).toEqual({
      weaponVisible: false,
      weaponYawRadians: 0,
      color: '#d6c7a4',
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
})
