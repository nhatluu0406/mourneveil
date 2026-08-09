import { describe, expect, it } from 'vitest'
import { advanceMeleeEnemy, createEnemyAttackSpatialSnapshot } from './meleeEnemy'
import {
  BRUTE_ROLE,
  SKIRMISHER_ROLE,
  createEnemyRuntimeFromRole,
  createGrayboxEnemyRuntimes,
} from './enemyRoles'
import type { CharacterCollisionResolver } from '../character/playerMotor'
import { PlayerCombatHealthRuntime } from '../character/playerCombatHealth'
import { CombatContactRuntime, type CombatContactQuery } from '../combat/combatContact'
import { attackContactOverlapsSphere } from '../combat/playerAttackActions'

const STEP = 1 / 60
const FLAT_GROUND: CharacterCollisionResolver = (_position, translation) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})
const GEOMETRIC_QUERY: CombatContactQuery = ({ contactShape, hurtboxes }) =>
  hurtboxes
    .filter((hurtbox) => attackContactOverlapsSphere(contactShape, hurtbox))
    .map((hurtbox) => ({ hurtboxId: hurtbox.id, targetId: hurtbox.ownerId }))

describe('enemy role variants', () => {
  it('authors skirmisher and brute as distinct data-driven roles', () => {
    expect(SKIRMISHER_ROLE.definition.role).toBe('skirmisher')
    expect(BRUTE_ROLE.definition.role).toBe('brute')
    expect(SKIRMISHER_ROLE.definition.movementSpeed).toBeGreaterThan(
      BRUTE_ROLE.definition.movementSpeed,
    )
    expect(BRUTE_ROLE.definition.maximumHealth).toBeGreaterThan(
      SKIRMISHER_ROLE.definition.maximumHealth,
    )
    expect(SKIRMISHER_ROLE.attack.startupSteps).toBeLessThan(BRUTE_ROLE.attack.startupSteps)
    expect(BRUTE_ROLE.damage).toBeGreaterThan(SKIRMISHER_ROLE.damage)
    expect(BRUTE_ROLE.definition.body.radius).toBeGreaterThan(
      SKIRMISHER_ROLE.definition.body.radius,
    )
  })

  it('instantiates independent runtimes without shared mutable state', () => {
    const [skirmisher, brute] = createGrayboxEnemyRuntimes()
    expect(skirmisher.id).not.toBe(brute.id)
    expect(skirmisher.snapshot().definitionId).toBe(SKIRMISHER_ROLE.definition.id)
    expect(brute.snapshot().definitionId).toBe(BRUTE_ROLE.definition.id)

    skirmisher.transition('pursue', 'player')
    expect(skirmisher.startAction(SKIRMISHER_ROLE.attack.id, { x: -1, z: 0 })).toMatchObject({
      accepted: true,
      executionId: 1,
    })
    expect(brute.snapshot()).toMatchObject({
      state: 'idle',
      action: { phase: 'idle', executionId: null },
      health: { current: BRUTE_ROLE.definition.maximumHealth },
    })
    expect(skirmisher.snapshot().health.current).toBe(SKIRMISHER_ROLE.definition.maximumHealth)
  })

  it('keeps independent health and hit-dedup across role instances', () => {
    const skirmisher = createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
    const brute = createEnemyRuntimeFromRole(BRUTE_ROLE)
    const player = new PlayerCombatHealthRuntime({ x: 0, y: 0.82, z: 0 })
    const skirmisherContact = new CombatContactRuntime()
    const bruteContact = new CombatContactRuntime()

    const close = { x: SKIRMISHER_ROLE.spawnPosition.x - 1, y: 0.82, z: SKIRMISHER_ROLE.spawnPosition.z }
    advanceMeleeEnemy(skirmisher, close, STEP, FLAT_GROUND)
    for (let step = 0; step < SKIRMISHER_ROLE.attack.startupSteps; step += 1) {
      advanceMeleeEnemy(skirmisher, close, STEP, FLAT_GROUND)
    }
    const bruteClose = {
      x: BRUTE_ROLE.spawnPosition.x + 1.2,
      y: 0.82,
      z: BRUTE_ROLE.spawnPosition.z,
    }
    advanceMeleeEnemy(brute, bruteClose, STEP, FLAT_GROUND)
    for (let step = 0; step < BRUTE_ROLE.attack.startupSteps; step += 1) {
      advanceMeleeEnemy(brute, bruteClose, STEP, FLAT_GROUND)
    }

    const resolve = (
      enemy: typeof skirmisher,
      contacts: CombatContactRuntime,
      position: { x: number; y: number; z: number },
    ) => {
      player.updatePosition(position)
      const snapshot = enemy.snapshot()
      return contacts.resolveContact({
        attackerId: snapshot.id,
        combat: snapshot.action,
        contactShape: createEnemyAttackSpatialSnapshot(snapshot).activeContactShape,
        simulationStep: 1,
        targets: [player],
        query: GEOMETRIC_QUERY,
        damage: snapshot.definitionId === SKIRMISHER_ROLE.definition.id
          ? SKIRMISHER_ROLE.damage
          : BRUTE_ROLE.damage,
      })
    }

    expect(resolve(skirmisher, skirmisherContact, close)).toHaveLength(1)
    expect(resolve(skirmisher, skirmisherContact, close)).toEqual([])
    expect(player.snapshot().health.current).toBe(100 - SKIRMISHER_ROLE.damage)

    expect(resolve(brute, bruteContact, bruteClose)).toHaveLength(1)
    expect(player.snapshot().health.current).toBe(
      100 - SKIRMISHER_ROLE.damage - BRUTE_ROLE.damage,
    )

    skirmisher.applyDamage(SKIRMISHER_ROLE.definition.maximumHealth)
    expect(skirmisher.snapshot().alive).toBe(false)
    expect(brute.snapshot().alive).toBe(true)
    expect(brute.snapshot().state).not.toBe('defeated')
  })
})
