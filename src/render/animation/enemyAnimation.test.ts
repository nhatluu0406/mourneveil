import { describe, expect, it } from 'vitest'
import { BRUTE_ROLE, SKIRMISHER_ROLE, createEnemyRuntimeFromRole } from '../../game/enemies/enemyRoles'
import type { CombatContactSnapshot } from '../../game/combat/combatContact'
import { projectEnemyAnimation } from './enemyAnimationProjection'
import { resolveEnemyProceduralPose } from './enemyProceduralPose'

const NO_HIT: CombatContactSnapshot = { totalHitCount: 0, lastHit: null }

describe('shared enemy animation foundation', () => {
  it('projects both roles through one contract with distinct authored tuning', () => {
    const skirmisher = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    const brute = createEnemyRuntimeFromRole(BRUTE_ROLE)
    skirmisher.transition('pursue', 'player')
    brute.transition('pursue', 'player')
    skirmisher.setMotion({ x: 0.1, y: 0.82, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 1, z: 0 })
    brute.setMotion({ x: 0.1, y: 0.82, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, z: 0 })

    const skirmisherState = projectEnemyAnimation(skirmisher.snapshot(), 20, NO_HIT)
    const bruteState = projectEnemyAnimation(brute.snapshot(), 20, NO_HIT)
    expect(skirmisherState.mode).toBe('locomotion')
    expect(bruteState.mode).toBe('locomotion')
    expect(SKIRMISHER_ROLE.presentation.animation).not.toEqual(
      BRUTE_ROLE.presentation.animation,
    )
    expect(
      resolveEnemyProceduralPose(skirmisherState, SKIRMISHER_ROLE.presentation.animation, 20),
    ).not.toEqual(
      resolveEnemyProceduralPose(bruteState, BRUTE_ROLE.presentation.animation, 20),
    )
  })

  it('keeps attack presentation on accepted execution facing until recovery completes', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    enemy.startAction(SKIRMISHER_ROLE.attack.id, { x: 1, z: 0 })
    const accepted = projectEnemyAnimation(enemy.snapshot(), 1, NO_HIT)
    expect(accepted.mode).toBe('enemy-attack')
    expect(accepted.facing).toEqual({ x: 1, z: 0 })

    enemy.setMotion(enemy.snapshot().position, { x: 0, y: 0, z: -2 }, { x: 0, z: -1 })
    expect(projectEnemyAnimation(enemy.snapshot(), 2, NO_HIT).facing).toEqual({ x: 1, z: 0 })

    for (
      let step = 0;
      step <
        SKIRMISHER_ROLE.attack.startupSteps +
          SKIRMISHER_ROLE.attack.activeSteps +
          SKIRMISHER_ROLE.attack.recoverySteps +
          4 &&
      enemy.snapshot().action.phase !== 'idle';
      step += 1
    ) {
      enemy.advanceAction()
    }
    expect(enemy.snapshot().state).toBe('spacing')
    enemy.startAction(SKIRMISHER_ROLE.attack.id, { x: 0, z: -1 })
    expect(projectEnemyAnimation(enemy.snapshot(), 90, NO_HIT).facing).toEqual({ x: 0, z: -1 })
  })

  it('derives deterministic action progress, hit reaction, and defeated override', () => {
    const enemy = createEnemyRuntimeFromRole(BRUTE_ROLE)
    enemy.transition('pursue', 'player')
    enemy.startAction(BRUTE_ROLE.attack.id, { x: -1, z: 0 })
    enemy.advanceAction()
    const action = projectEnemyAnimation(enemy.snapshot(), 1, NO_HIT)
    expect(action.action?.normalizedPhaseProgress).toBe(1 / BRUTE_ROLE.attack.startupSteps)

    const attackBudget =
      BRUTE_ROLE.attack.startupSteps +
      BRUTE_ROLE.attack.activeSteps +
      BRUTE_ROLE.attack.recoverySteps +
      4
    for (let step = 0; step < attackBudget && enemy.snapshot().action.phase !== 'idle'; step += 1) {
      enemy.advanceAction()
    }
    expect(enemy.snapshot().action.phase).toBe('idle')
    const hitContact: CombatContactSnapshot = {
      totalHitCount: 1,
      lastHit: {
        type: 'combat-hit',
        attackerId: 'player',
        targetId: enemy.id,
        actionId: 'player.attack.light',
        executionId: 2,
        contactWindowId: 'player.attack.light.contact',
        contactPosition: enemy.snapshot().position,
        simulationStep: 120,
        damage: 20,
        appliedDamage: 20,
        outcome: 'damaged',
      },
    }
    expect(projectEnemyAnimation(enemy.snapshot(), 120, hitContact).mode).toBe('hit-reaction')

    enemy.applyDamage(1000)
    expect(projectEnemyAnimation(enemy.snapshot(), 121, hitContact).mode).toBe('defeated')
  })
})
