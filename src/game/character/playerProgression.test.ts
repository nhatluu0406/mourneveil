import { describe, expect, it } from 'vitest'
import {
  PLAYER_LEVEL_CUMULATIVE_XP,
  PLAYER_MAX_LEVEL,
  PlayerProgressionRuntime,
  allocateProgressionPoint,
  createDefaultProgressionState,
  grantExperience,
  levelForExperience,
  projectProgressionSnapshot,
} from './playerProgression'
import { ZERO_ITEM_MODIFIERS } from '../items/itemDefinition'
import { resolvePlayerCombatStats } from './playerStatResolution'
import { PLAYER_MAXIMUM_HEALTH } from './playerHealth'
import { PLAYER_GUARD_IMPACT_THRESHOLD } from '../combat/playerDefense'

describe('player progression XP/level', () => {
  it('starts at level 1 with zero XP and no points', () => {
    const snap = projectProgressionSnapshot(createDefaultProgressionState())
    expect(snap.level).toBe(1)
    expect(snap.experience).toBe(0)
    expect(snap.unspentPoints).toBe(0)
    expect(snap.experienceToNextLevel).toBe(50)
  })

  it('grants XP and crosses thresholds with one point per level', () => {
    let state = createDefaultProgressionState()
    const first = grantExperience(state, 50)
    expect(first.levelsGained).toBe(1)
    expect(first.pointsGained).toBe(1)
    expect(first.state.level).toBe(2)
    expect(first.state.unspentPoints).toBe(1)
    state = first.state

    const multi = grantExperience(state, 300)
    expect(multi.state.level).toBe(PLAYER_MAX_LEVEL)
    expect(multi.state.experience).toBe(350)
    expect(multi.levelsGained).toBe(3)
    expect(multi.state.unspentPoints).toBe(4)
    expect(levelForExperience(PLAYER_LEVEL_CUMULATIVE_XP[PLAYER_MAX_LEVEL]!)).toBe(5)
  })

  it('rejects invalid allocation and accepts valid spends', () => {
    const leveled = grantExperience(createDefaultProgressionState(), 50).state
    expect(allocateProgressionPoint(leveled, 'luck').accepted).toBe(false)
    expect(allocateProgressionPoint(leveled, 'vitality')).toMatchObject({
      accepted: true,
      attribute: 'vitality',
      state: { unspentPoints: 0, allocation: { vitality: 1, resolve: 0, might: 0 } },
    })
    expect(allocateProgressionPoint(leveled, 'vitality').accepted).toBe(true)
    const spent = allocateProgressionPoint(leveled, 'vitality')
    if (!spent.accepted) throw new Error('expected spend')
    expect(allocateProgressionPoint(spent.state, 'might').accepted).toBe(false)
  })

  it('runtime allocates and snapshots HUD fields', () => {
    const runtime = new PlayerProgressionRuntime()
    runtime.grantExperience(50)
    expect(runtime.allocate('resolve')).toMatchObject({ accepted: true })
    const snap = runtime.snapshot()
    expect(snap.level).toBe(2)
    expect(snap.allocation.resolve).toBe(1)
    expect(snap.unspentPoints).toBe(0)
    expect(snap.experienceIntoLevel).toBe(0)
  })
})

describe('player stat resolution', () => {
  it('composes base + progression + equipment without double application', () => {
    const equipment = {
      lightDamageBonus: 8,
      heavyDamageBonus: 12,
      maxHealthBonus: 20,
      guardImpactThresholdBonus: 1,
    }
    const resolved = resolvePlayerCombatStats(
      { vitality: 2, resolve: 1, might: 1 },
      equipment,
    )
    expect(resolved.maximumHealth).toBe(PLAYER_MAXIMUM_HEALTH + 20 + 20)
    expect(resolved.guardImpactThreshold).toBe(PLAYER_GUARD_IMPACT_THRESHOLD + 1 + 1)
    expect(resolved.lightDamage).toBe(20 + 2 + 8)
    expect(resolved.heavyDamage).toBe(35 + 3 + 12)
    expect(resolved.progression.maxHealthFromProgression).toBe(20)
    expect(resolved.equipment.maxHealthBonus).toBe(20)

    const charmOnly = resolvePlayerCombatStats(
      { vitality: 2, resolve: 0, might: 0 },
      { ...ZERO_ITEM_MODIFIERS, maxHealthBonus: 20 },
    )
    const progOnly = resolvePlayerCombatStats(
      { vitality: 2, resolve: 0, might: 0 },
      ZERO_ITEM_MODIFIERS,
    )
    expect(charmOnly.maximumHealth).toBe(progOnly.maximumHealth + 20)
  })
})
