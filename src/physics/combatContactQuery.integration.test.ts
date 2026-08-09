import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  PLAYER_HEAVY_ATTACK,
  PLAYER_LIGHT_ATTACK,
  transformPlayerAttackContactShape,
} from '../game/combat/playerAttackActions'
import type { SphereHurtbox } from '../game/combat/combatTarget'
import { PlayerHealthRuntime } from '../game/character/playerHealth'
import {
  MELEE_ENEMY_ATTACK,
  createEnemyAttackSpatialSnapshot,
  createMeleeEnemyRuntime,
} from '../game/enemies/meleeEnemy'
import { createRapierCombatContactQuery } from './combatContactQuery'

beforeAll(async () => {
  await RAPIER.init()
})

const HURTBOX: SphereHurtbox = {
  id: 'target.hurtbox',
  ownerId: 'target',
  kind: 'sphere',
  center: { x: 0, y: 0.82, z: -1 },
  radius: 0.45,
}

function createFixture() {
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 })
  const collider = world.createCollider(
    RAPIER.ColliderDesc.ball(HURTBOX.radius)
      .setTranslation(HURTBOX.center.x, HURTBOX.center.y, HURTBOX.center.z)
      .setSensor(true),
  )
  world.step()
  return {
    world,
    query: createRapierCombatContactQuery(world, RAPIER, [
      { hurtboxId: HURTBOX.id, collider },
    ]),
  }
}

describe('Rapier combat contact query', () => {
  it.each([PLAYER_LIGHT_ATTACK, PLAYER_HEAVY_ATTACK])(
    'finds a target inside the $kind authoritative sphere',
    (attack) => {
      const { world, query } = createFixture()
      const shape = transformPlayerAttackContactShape(
        attack.contactShape,
        { x: 0, y: 0.82, z: 0 },
        { x: 0, z: -1 },
      )

      expect(query({ contactShape: shape, hurtboxes: [HURTBOX] })).toEqual([
        { hurtboxId: HURTBOX.id, targetId: HURTBOX.ownerId },
      ])
      world.free()
    },
  )

  it('does not find a target outside the contact sphere', () => {
    const { world, query } = createFixture()
    const shape = transformPlayerAttackContactShape(
      PLAYER_LIGHT_ATTACK.contactShape,
      { x: 5, y: 0.82, z: 0 },
      { x: 0, z: -1 },
    )

    expect(query({ contactShape: shape, hurtboxes: [HURTBOX] })).toEqual([])
    world.free()
  })

  it('moves the contact query with authoritative facing', () => {
    const { world, query } = createFixture()
    const away = transformPlayerAttackContactShape(
      PLAYER_LIGHT_ATTACK.contactShape,
      { x: 0, y: 0.82, z: 0 },
      { x: 0, z: 1 },
    )
    const toward = transformPlayerAttackContactShape(
      PLAYER_LIGHT_ATTACK.contactShape,
      { x: 0, y: 0.82, z: 0 },
      { x: 0, z: -1 },
    )

    expect(query({ contactShape: away, hurtboxes: [HURTBOX] })).toEqual([])
    expect(query({ contactShape: toward, hurtboxes: [HURTBOX] })).toHaveLength(1)
    world.free()
  })

  it('queries the player hurtbox from enemy execution-facing contact', () => {
    const player = new PlayerHealthRuntime({ x: 1.3, y: 0.82, z: 3 })
    const hurtbox = player.snapshot().hurtbox
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 })
    const collider = world.createCollider(
      RAPIER.ColliderDesc.ball(hurtbox.radius)
        .setTranslation(hurtbox.center.x, hurtbox.center.y, hurtbox.center.z)
        .setSensor(true),
    )
    world.step()
    const query = createRapierCombatContactQuery(world, RAPIER, [
      { hurtboxId: hurtbox.id, collider },
    ])

    const toward = createMeleeEnemyRuntime()
    toward.transition('pursue', 'player')
    toward.startAction(MELEE_ENEMY_ATTACK.id, { x: -1, z: 0 })
    const away = createMeleeEnemyRuntime()
    away.transition('pursue', 'player')
    away.startAction(MELEE_ENEMY_ATTACK.id, { x: 1, z: 0 })
    for (let step = 0; step < MELEE_ENEMY_ATTACK.startupSteps; step += 1) {
      toward.advanceAction()
      away.advanceAction()
    }

    expect(
      query({
        contactShape: createEnemyAttackSpatialSnapshot(toward.snapshot()).activeContactShape!,
        hurtboxes: [hurtbox],
      }),
    ).toHaveLength(1)
    expect(
      query({
        contactShape: createEnemyAttackSpatialSnapshot(away.snapshot()).activeContactShape!,
        hurtboxes: [hurtbox],
      }),
    ).toEqual([])
    world.free()
  })
})
