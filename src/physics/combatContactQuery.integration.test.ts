import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  PLAYER_HEAVY_ATTACK,
  PLAYER_LIGHT_ATTACK,
  transformPlayerAttackContactShape,
} from '../game/combat/playerAttackActions'
import type { SphereHurtbox } from '../game/combat/trainingTarget'
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
})
