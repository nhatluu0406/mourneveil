import { describe, expect, it } from 'vitest'
import { PLAYER_HEAVY_ATTACK_ID, PLAYER_LIGHT_ATTACK_ID } from '../combat/playerAttackActions'
import {
  ENEMY_HIT_REACTION_DURATION_STEPS,
  ENEMY_HIT_REACTION_IMMUNITY_STEPS,
  enemyPhaseAllowsInterrupt,
  interruptImpactForPlayerAction,
} from './enemyHitReaction'
import {
  BRUTE_ROLE,
  SKIRMISHER_ROLE,
  createEnemyRuntimeFromRole,
} from './enemyRoles'
import { advanceMeleeEnemy } from './meleeEnemy'

function damagedHit(actionId: string, executionId: number) {
  return {
    actionId,
    executionId,
    outcome: 'damaged' as const,
  }
}

describe('enemy hit reaction / interrupt', () => {
  it('A: heavy hit damages skirmisher and enters hit reaction', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    expect(interruptImpactForPlayerAction(PLAYER_LIGHT_ATTACK_ID)).toBe(0)
    expect(interruptImpactForPlayerAction(PLAYER_HEAVY_ATTACK_ID)).toBe(1)

    expect(enemy.applyDamage(20)).toMatchObject({ applied: true })
    expect(enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 1))).toBe(true)
    expect(enemy.snapshot()).toMatchObject({
      state: 'hitReaction',
      hitReactionRemainingSteps: ENEMY_HIT_REACTION_DURATION_STEPS,
      velocity: { x: 0, y: 0, z: 0 },
      action: { phase: 'idle' },
    })
  })

  it('B: reaction suppresses enemy movement and attack starts', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    enemy.applyDamage(10)
    enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 2))
    advanceMeleeEnemy(enemy, { x: 2.5, y: 0.82, z: 3 }, 1 / 60, null)
    expect(enemy.snapshot().state).toBe('hitReaction')
    expect(enemy.snapshot().velocity).toEqual({ x: 0, y: 0, z: 0 })
    expect(enemy.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 }).accepted).toBe(false)
  })

  it('C: interruptible attack startup is cancelled into hit reaction', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    expect(enemy.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 }).accepted).toBe(true)
    expect(enemy.snapshot().action.phase).toBe('startup')
    expect(enemyPhaseAllowsInterrupt('attack', 'startup')).toBe(true)
    enemy.applyDamage(10)
    expect(enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 3))).toBe(true)
    expect(enemy.snapshot()).toMatchObject({
      state: 'hitReaction',
      action: { phase: 'idle', actionId: null },
      attackExecutionFacing: null,
    })
  })

  it('D: committed attack active phase is not interrupted', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    enemy.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 })
    for (let step = 0; step < SKIRMISHER_ROLE.attack.startupSteps; step += 1) {
      enemy.advanceAction()
    }
    expect(enemy.snapshot().action.phase).toBe('active')
    expect(enemyPhaseAllowsInterrupt('attack', 'active')).toBe(false)
    enemy.applyDamage(10)
    expect(enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 4))).toBe(false)
    expect(enemy.snapshot().state).toBe('attack')
    expect(enemy.snapshot().action.phase).toBe('active')
  })

  it('E: same execution cannot retrigger reaction repeatedly', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    enemy.applyDamage(10)
    expect(enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 5))).toBe(true)
    for (let step = 0; step < ENEMY_HIT_REACTION_DURATION_STEPS; step += 1) {
      enemy.advanceHitReaction()
    }
    expect(enemy.snapshot().state).toBe('pursue')
    // Same execution id still blocked even after recovery.
    expect(enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 5))).toBe(false)
    // New execution can interrupt again after immunity elapses.
    for (let step = 0; step < ENEMY_HIT_REACTION_IMMUNITY_STEPS; step += 1) {
      enemy.advanceHitReaction()
    }
    enemy.applyDamage(10)
    expect(enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 6))).toBe(true)
  })

  it('F: recovery returns enemy to chase behavior', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    enemy.applyDamage(10)
    enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 7))
    for (let step = 0; step < ENEMY_HIT_REACTION_DURATION_STEPS; step += 1) {
      advanceMeleeEnemy(enemy, { x: 4, y: 0.82, z: 3 }, 1 / 60, null)
    }
    expect(enemy.snapshot().state).toBe('pursue')
    expect(enemy.snapshot().targetId).toBe('player')
  })

  it('G: defeated enemy remains defeated and never reacts', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    enemy.applyDamage(SKIRMISHER_ROLE.definition.maximumHealth)
    expect(enemy.snapshot().state).toBe('defeated')
    expect(enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 8))).toBe(false)
    expect(enemy.snapshot().state).toBe('defeated')
  })

  it('H: brute requires two heavy executions before reacting', () => {
    const enemy = createEnemyRuntimeFromRole(BRUTE_ROLE)
    enemy.transition('pursue', 'player')
    enemy.applyDamage(10)
    expect(enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 9))).toBe(false)
    expect(enemy.snapshot()).toMatchObject({ state: 'pursue', interruptMeter: 1 })
    enemy.applyDamage(10)
    expect(enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 10))).toBe(true)
    expect(enemy.snapshot().state).toBe('hitReaction')
  })

  it('I: after reaction, pursue resumes and can start attacks again', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    enemy.applyDamage(10)
    enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 11))
    for (let step = 0; step < ENEMY_HIT_REACTION_DURATION_STEPS + ENEMY_HIT_REACTION_IMMUNITY_STEPS; step += 1) {
      enemy.advanceHitReaction()
    }
    expect(enemy.snapshot().state).toBe('pursue')
    expect(enemy.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 }).accepted).toBe(true)
  })

  it('light hits never contribute interrupt meter', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    enemy.applyDamage(10)
    expect(enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_LIGHT_ATTACK_ID, 12))).toBe(false)
    expect(enemy.snapshot()).toMatchObject({ state: 'pursue', interruptMeter: 0 })
  })

  it('K: reset clears transient reaction state', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    enemy.applyDamage(10)
    enemy.applyHitReactionFromDamagedHit(damagedHit(PLAYER_HEAVY_ATTACK_ID, 13))
    enemy.reset(SKIRMISHER_ROLE.spawnPosition)
    expect(enemy.snapshot()).toMatchObject({
      state: 'idle',
      hitReactionRemainingSteps: 0,
      interruptMeter: 0,
      hitReactionImmunityRemainingSteps: 0,
    })
  })
})
