import { describe, expect, it } from 'vitest'
import { createCombatHealth } from '../combat/combatHealth'
import { PLAYER_FLASK_DEFINITION, PlayerFlaskRuntime } from './playerFlask'

describe('canonical player flask', () => {
  it('centralizes charges/heal amount and rejects dead, full-health, and empty use', () => {
    const flask = new PlayerFlaskRuntime()
    expect(flask.snapshot()).toMatchObject({
      maximumCharges: 3,
      currentCharges: 3,
      healAmount: 40,
    })
    expect(flask.validateUse(createCombatHealth(100))).toEqual({
      allowed: false,
      reason: 'full-health',
    })
    expect(
      flask.validateUse({ maximum: 100, current: 0, alive: false }),
    ).toEqual({ allowed: false, reason: 'actor-dead' })
    expect(PLAYER_FLASK_DEFINITION.action.resourceCost).toEqual({
      resourceId: 'player.flask-charge',
      amount: 1,
    })
  })
})
