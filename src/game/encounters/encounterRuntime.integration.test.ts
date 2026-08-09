import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../runtime/GameRuntime'
import { BRUTE_ROLE, SKIRMISHER_ROLE } from '../enemies/enemyRoles'
import { createGrayboxEncounterSnapshot } from './grayboxEncounter'

describe('player runtime graybox encounter projection', () => {
  it('projects an active mixed encounter and restores it on melee fixture reset', () => {
    const runtime = new GameRuntime()
    expect(runtime.snapshot().encounter).toMatchObject({
      id: 'encounter.graybox.mixed',
      phase: 'active',
      enemyIds: [SKIRMISHER_ROLE.runtimeId, BRUTE_ROLE.runtimeId],
      defeatedEnemyIds: [],
    })

    runtime.resetMeleeFixture()
    expect(runtime.snapshot().encounter.phase).toBe('active')
    expect(runtime.snapshot().enemies.every((enemy) => enemy.alive)).toBe(true)
    expect(runtime.snapshot().enemies.map((enemy) => enemy.health.current)).toEqual([
      SKIRMISHER_ROLE.definition.maximumHealth,
      BRUTE_ROLE.definition.maximumHealth,
      SKIRMISHER_ROLE.definition.maximumHealth,
      SKIRMISHER_ROLE.definition.maximumHealth,
    ])
  })

  it('derives complete only after every encounter enemy is defeated', () => {
    const ids = [SKIRMISHER_ROLE.runtimeId, BRUTE_ROLE.runtimeId]
    expect(
      createGrayboxEncounterSnapshot(ids, [
        { id: SKIRMISHER_ROLE.runtimeId, alive: false },
        { id: BRUTE_ROLE.runtimeId, alive: true },
      ]).phase,
    ).toBe('active')
    expect(
      createGrayboxEncounterSnapshot(ids, [
        { id: SKIRMISHER_ROLE.runtimeId, alive: false },
        { id: BRUTE_ROLE.runtimeId, alive: false },
      ]).phase,
    ).toBe('complete')
  })
})
