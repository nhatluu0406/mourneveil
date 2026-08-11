import { describe, expect, it } from 'vitest'
import { PLAYER_HEAVY_ATTACK_ID } from '../game/combat/playerAttackActions'
import { PLAYER_LIGHT_ATTACK } from '../game/combat/playerAttackActions'
import {
  BRUTE_ROLE,
  SKIRMISHER_ROLE,
  createEnemyRuntimeFromRole,
} from '../game/enemies/enemyRoles'
import { createEnemyAttackSpatialSnapshot } from '../game/enemies/meleeEnemy'
import { createEnemyAttackPresentationSnapshot } from './enemyAttackPresentation'
import { resolveEnemyProceduralPose } from './animation/enemyProceduralPose'
import { projectEnemyAnimation } from './animation/enemyAnimationProjection'

const NO_HIT = { totalHitCount: 0, lastHit: null }

describe('enemy telegraph timing and phase presentation', () => {
  it('A–G: authored skirmisher/brute timings differ and phase transitions are deterministic', () => {
    expect(SKIRMISHER_ROLE.attack).toMatchObject({
      startupSteps: 20,
      activeSteps: 10,
      recoverySteps: 24,
    })
    expect(BRUTE_ROLE.attack).toMatchObject({
      startupSteps: 48,
      activeSteps: 12,
      recoverySteps: 48,
    })
    expect(SKIRMISHER_ROLE.attack.startupSteps).toBeLessThan(BRUTE_ROLE.attack.startupSteps)
    expect(SKIRMISHER_ROLE.attack.recoverySteps).toBeLessThan(BRUTE_ROLE.attack.recoverySteps)
    // Recovery is long enough to start a light attack when in range.
    expect(SKIRMISHER_ROLE.attack.recoverySteps).toBeGreaterThanOrEqual(
      PLAYER_LIGHT_ATTACK.action.startupSteps,
    )

    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    expect(enemy.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 }).accepted).toBe(true)
    expect(enemy.snapshot().action.phase).toBe('startup')
    const startupPresentation = createEnemyAttackPresentationSnapshot(
      enemy.snapshot(),
      createEnemyAttackSpatialSnapshot(enemy.snapshot()),
    )
    expect(startupPresentation.telegraphVisible).toBe(true)
    expect(startupPresentation.recoveryVisible).toBe(false)

    for (let step = 0; step < SKIRMISHER_ROLE.attack.startupSteps; step += 1) enemy.advanceAction()
    expect(enemy.snapshot().action.phase).toBe('active')
    expect(enemy.snapshot().action.contact.enabled).toBe(true)
    expect(
      createEnemyAttackPresentationSnapshot(
        enemy.snapshot(),
        createEnemyAttackSpatialSnapshot(enemy.snapshot()),
      ),
    ).toMatchObject({ telegraphVisible: false, recoveryVisible: false, contactVisible: true })

    for (let step = 0; step < SKIRMISHER_ROLE.attack.activeSteps; step += 1) enemy.advanceAction()
    expect(enemy.snapshot().state).toBe('recovery')
    expect(enemy.snapshot().action.phase).toBe('recovery')
    expect(enemy.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 }).accepted).toBe(false)
    expect(
      createEnemyAttackPresentationSnapshot(
        enemy.snapshot(),
        createEnemyAttackSpatialSnapshot(enemy.snapshot()),
      ).recoveryVisible,
    ).toBe(true)

    for (let step = 0; step < SKIRMISHER_ROLE.attack.recoverySteps; step += 1) enemy.advanceAction()
    expect(enemy.snapshot().action.phase).toBe('idle')
    expect(enemy.snapshot().state).toBe('spacing')
    expect(enemy.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 }).accepted).toBe(true)
  })

  it('H–J: heavy interrupt rules by phase remain valid after timing tune', () => {
    const enemy = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    enemy.transition('pursue', 'player')
    enemy.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 })
    enemy.applyDamage(10)
    expect(
      enemy.applyHitReactionFromDamagedHit({
        actionId: PLAYER_HEAVY_ATTACK_ID,
        executionId: 1,
        outcome: 'damaged',
      }),
    ).toBe(true)
    expect(enemy.snapshot().state).toBe('hitReaction')

    const active = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    active.transition('pursue', 'player')
    active.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 })
    for (let step = 0; step < SKIRMISHER_ROLE.attack.startupSteps; step += 1) active.advanceAction()
    expect(active.snapshot().action.phase).toBe('active')
    active.applyDamage(10)
    expect(
      active.applyHitReactionFromDamagedHit({
        actionId: PLAYER_HEAVY_ATTACK_ID,
        executionId: 2,
        outcome: 'damaged',
      }),
    ).toBe(false)

    const recovering = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    recovering.transition('pursue', 'player')
    recovering.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 })
    for (
      let step = 0;
      step < SKIRMISHER_ROLE.attack.startupSteps + SKIRMISHER_ROLE.attack.activeSteps;
      step += 1
    ) {
      recovering.advanceAction()
    }
    expect(recovering.snapshot().action.phase).toBe('recovery')
    recovering.applyDamage(10)
    expect(
      recovering.applyHitReactionFromDamagedHit({
        actionId: PLAYER_HEAVY_ATTACK_ID,
        executionId: 3,
        outcome: 'damaged',
      }),
    ).toBe(true)
  })

  it('N: defeated enemies cannot resume attack', () => {
    const enemy = createEnemyRuntimeFromRole(BRUTE_ROLE)
    enemy.transition('pursue', 'player')
    enemy.applyDamage(BRUTE_ROLE.definition.maximumHealth)
    expect(enemy.snapshot().state).toBe('defeated')
    expect(enemy.startAction(BRUTE_ROLE.attack.id, { x: 1, z: 0 }).accepted).toBe(false)
  })

  it('startup and recovery procedural poses are distinguishable', () => {
    const enemy = createEnemyRuntimeFromRole(BRUTE_ROLE)
    enemy.transition('pursue', 'player')
    enemy.startAction(BRUTE_ROLE.attack.id, { x: 1, z: 0 })
    // Mid-startup coil (progress > 0) so anticipation is measurable.
    for (let step = 0; step < Math.floor(BRUTE_ROLE.attack.startupSteps / 2); step += 1) {
      enemy.advanceAction()
    }
    expect(enemy.snapshot().action.phase).toBe('startup')
    const startup = resolveEnemyProceduralPose(
      projectEnemyAnimation(enemy.snapshot(), 24, NO_HIT),
      BRUTE_ROLE.presentation.animation,
      24,
    )
    while (enemy.snapshot().action.phase !== 'recovery') enemy.advanceAction()
    for (let step = 0; step < Math.floor(BRUTE_ROLE.attack.recoverySteps / 2); step += 1) {
      enemy.advanceAction()
    }
    expect(enemy.snapshot().action.phase).toBe('recovery')
    const recovery = resolveEnemyProceduralPose(
      projectEnemyAnimation(enemy.snapshot(), 80, NO_HIT),
      BRUTE_ROLE.presentation.animation,
      80,
    )
    expect(startup.bodyPitch).toBeLessThan(0)
    expect(recovery.bodyPitch).toBeGreaterThan(0)
    expect(startup.weaponPitch).toBeLessThan(recovery.weaponPitch)
  })
})
