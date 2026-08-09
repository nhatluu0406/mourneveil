import { describe, expect, it } from 'vitest'
import {
  MELEE_ENEMY_ATTACK,
  advanceMeleeEnemy,
  createEnemyAttackSpatialSnapshot,
  createMeleeEnemyRuntime,
} from '../game/enemies/meleeEnemy'
import { createEnemyAttackPresentationSnapshot } from './enemyAttackPresentation'

const STEP = 1 / 60
const FLAT_GROUND = (_position: unknown, translation: { x: number; y: number; z: number }) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})

describe('enemy attack presentation projection', () => {
  it.each([
    [{ x: 1.5, y: 0.82, z: 3 }, { x: -1, z: 0 }],
    [{ x: 3.5, y: 0.82, z: 3 }, { x: 1, z: 0 }],
    [{ x: 2.5, y: 0.82, z: 2.0 }, { x: 0, z: -1 }],
    [{ x: 2.5, y: 0.82, z: 4.0 }, { x: 0, z: 1 }],
  ])('aligns local -Z telegraph with execution facing for %o', (playerPosition, expected) => {
    const enemy = createMeleeEnemyRuntime()
    advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
    const snapshot = enemy.snapshot()
    const attack = createEnemyAttackSpatialSnapshot(snapshot)
    const presentation = createEnemyAttackPresentationSnapshot(snapshot, attack)

    expect(presentation.facing.x).toBeCloseTo(expected.x)
    expect(presentation.facing.z).toBeCloseTo(expected.z)
    expect(-Math.sin(presentation.yawRadians)).toBeCloseTo(expected.x)
    expect(-Math.cos(presentation.yawRadians)).toBeCloseTo(expected.z)
    expect(presentation.telegraphVisible).toBe(true)
  })

  it('keeps telegraph and contact on one execution-facing projection', () => {
    const playerAtStart = { x: 1.5, y: 0.82, z: 3 }
    const enemy = createMeleeEnemyRuntime()
    advanceMeleeEnemy(enemy, playerAtStart, STEP, FLAT_GROUND)
    const startup = enemy.snapshot()
    const startupAttack = createEnemyAttackSpatialSnapshot(startup)
    const startupPresentation = createEnemyAttackPresentationSnapshot(
      startup,
      startupAttack,
    )

    for (let step = 0; step < MELEE_ENEMY_ATTACK.startupSteps; step += 1) {
      advanceMeleeEnemy(enemy, { x: 3.5, y: 0.82, z: 3 }, STEP, FLAT_GROUND)
    }
    const active = enemy.snapshot()
    const activeAttack = createEnemyAttackSpatialSnapshot(active)
    const activePresentation = createEnemyAttackPresentationSnapshot(active, activeAttack)

    expect(activeAttack.executionFacing).toEqual(startupAttack.executionFacing)
    expect(activePresentation.facing).toEqual(startupPresentation.facing)
    expect(activePresentation.contactVisible).toBe(true)
    expect(activeAttack.activeContactShape?.center.x).toBeLessThan(active.position.x)
  })
})
