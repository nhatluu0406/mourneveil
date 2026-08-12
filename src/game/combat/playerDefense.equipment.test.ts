import { describe, expect, it } from 'vitest'
import { CombatActionRuntime } from './combatActionRuntime'
import {
  PLAYER_GUARD_IMPACT_THRESHOLD,
  PlayerDefenseRuntime,
} from './playerDefense'

describe('playerDefense equipment threshold', () => {
  it('breaks guard only after the synced threshold is reached', () => {
    const defense = new PlayerDefenseRuntime()
    const combat = new CombatActionRuntime([]).snapshot()
    defense.setGuardImpactThreshold(PLAYER_GUARD_IMPACT_THRESHOLD + 1)
    defense.setGuardIntent(true)
    defense.advanceFixedStep(combat)

    const facing = { x: 0, z: 1 }
    const incoming = { x: 0, z: -1 }
    expect(defense.resolveIncomingMelee(combat, facing, incoming, 1)).toBe('guarded')
    expect(defense.resolveIncomingMelee(combat, facing, incoming, 1)).toBe('guarded')
    expect(defense.resolveIncomingMelee(combat, facing, incoming, 1)).toBe('guarded')
    expect(defense.snapshot(combat).guardImpact).toBe(3)
    expect(defense.resolveIncomingMelee(combat, facing, incoming, 1)).toBe('guard-broken')
  })
})
