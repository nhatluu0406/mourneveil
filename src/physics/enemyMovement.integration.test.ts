import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import type { CharacterCollisionResolver, Vector3Value } from '../game/character/playerMotor'
import { FIXED_STEP_SECONDS } from '../game/core/fixedStepClock'
import {
  MELEE_ENEMY_DEFINITION,
  advanceMeleeEnemy,
  createMeleeEnemyRuntime,
  horizontalDistance,
} from '../game/enemies/meleeEnemy'
import { GRAYBOX_CENTER_BLOCKER_SIZE } from './grayboxCollision'
import {
  CHARACTER_COLLISION_OFFSET,
  configureCharacterController,
} from './playerCollisionConfig'

beforeAll(async () => {
  await RAPIER.init()
})

function createEnemyController(world: RAPIER.World) {
  const enemy = createMeleeEnemyRuntime()
  const position = enemy.snapshot().position
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      position.x,
      position.y,
      position.z,
    ),
  )
  const collider = world.createCollider(
    RAPIER.ColliderDesc.capsule(
      MELEE_ENEMY_DEFINITION.body.halfHeight,
      MELEE_ENEMY_DEFINITION.body.radius,
    ),
    body,
  )
  const controller = world.createCharacterController(CHARACTER_COLLISION_OFFSET)
  configureCharacterController(controller)
  const resolveCollision: CharacterCollisionResolver = (current, desired) => {
    body.setTranslation(current, false)
    controller.computeColliderMovement(collider, desired)
    const corrected = controller.computedMovement()
    body.setTranslation(
      {
        x: current.x + corrected.x,
        y: current.y + corrected.y,
        z: current.z + corrected.z,
      },
      false,
    )
    return {
      translation: { x: corrected.x, y: corrected.y, z: corrected.z },
      grounded: controller.computedGrounded(),
    }
  }
  return { body, collider, controller, enemy, resolveCollision }
}

function createGrayboxWorld() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  world.timestep = FIXED_STEP_SECONDS
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(6, 0.25, 6).setTranslation(0, -0.25, 0),
  )
  return world
}

function stepEnemy(
  world: RAPIER.World,
  enemy: ReturnType<typeof createMeleeEnemyRuntime>,
  playerPosition: Vector3Value,
  resolveCollision: CharacterCollisionResolver,
  steps: number,
) {
  for (let step = 0; step < steps; step += 1) {
    advanceMeleeEnemy(
      enemy,
      playerPosition,
      FIXED_STEP_SECONDS,
      resolveCollision,
    )
    world.step()
  }
}

describe('enemy Rapier movement integration', () => {
  it('steers around the center blocker without penetration', () => {
    const world = createGrayboxWorld()
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        GRAYBOX_CENTER_BLOCKER_SIZE.x / 2,
        GRAYBOX_CENTER_BLOCKER_SIZE.y / 2,
        GRAYBOX_CENTER_BLOCKER_SIZE.z / 2,
      ).setTranslation(0, GRAYBOX_CENTER_BLOCKER_SIZE.y / 2, 0),
    )
    const { enemy, resolveCollision, controller } = createEnemyController(world)
    enemy.transition('pursue', 'player')
    const playerPosition = { x: -1.5, y: 0.82, z: -1.5 }
    const blockerHalfExtent = GRAYBOX_CENTER_BLOCKER_SIZE.x / 2

    for (let step = 0; step < 360; step += 1) {
      advanceMeleeEnemy(
        enemy,
        playerPosition,
        FIXED_STEP_SECONDS,
        resolveCollision,
      )
      world.step()
      const position = enemy.snapshot().position
      const distanceToBlocker = Math.hypot(
        Math.max(Math.abs(position.x) - blockerHalfExtent, 0),
        Math.max(Math.abs(position.z) - blockerHalfExtent, 0),
      )
      expect(distanceToBlocker).toBeGreaterThanOrEqual(
        MELEE_ENEMY_DEFINITION.body.radius - 0.02,
      )
    }

    expect(horizontalDistance(enemy.snapshot().position, playerPosition)).toBeLessThan(
      enemy.definition.attackRange,
    )
    expect(['attack', 'recovery', 'spacing']).toContain(enemy.snapshot().state)
    world.removeCharacterController(controller)
    world.free()
  })

  it('cannot penetrate the perimeter and recovers toward a changed open target', () => {
    const world = createGrayboxWorld()
    const wallCenterX = 5.75
    const wallHalfWidth = 0.25
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(wallHalfWidth, 0.75, 6).setTranslation(
        wallCenterX,
        0.75,
        0,
      ),
    )
    const { enemy, resolveCollision, controller } = createEnemyController(world)
    stepEnemy(world, enemy, { x: 6, y: 0.82, z: 3 }, resolveCollision, 180)
    const blocked = enemy.snapshot().position
    expect(blocked.x + MELEE_ENEMY_DEFINITION.body.radius).toBeLessThanOrEqual(
      wallCenterX - wallHalfWidth - CHARACTER_COLLISION_OFFSET + 0.002,
    )

    const openTarget = { x: 3, y: 0.82, z: 0 }
    const beforeRecovery = horizontalDistance(blocked, openTarget)
    stepEnemy(world, enemy, openTarget, resolveCollision, 120)
    expect(horizontalDistance(enemy.snapshot().position, openTarget)).toBeLessThan(
      beforeRecovery - 0.5,
    )
    world.removeCharacterController(controller)
    world.free()
  })

  it('maintains authored stand-off outside the player body', () => {
    const world = createGrayboxWorld()
    const playerPosition = { x: 0.8, y: 0.82, z: 3 }
    world.createCollider(
      RAPIER.ColliderDesc.capsule(0.45, 0.35).setTranslation(
        playerPosition.x,
        playerPosition.y,
        playerPosition.z,
      ),
    )
    const { enemy, resolveCollision, controller } = createEnemyController(world)
    stepEnemy(world, enemy, playerPosition, resolveCollision, 180)

    const distance = horizontalDistance(enemy.snapshot().position, playerPosition)
    expect(distance).toBeGreaterThanOrEqual(enemy.definition.stoppingRange - 0.002)
    expect(distance).toBeGreaterThan(
      enemy.definition.body.radius + 0.35 + CHARACTER_COLLISION_OFFSET,
    )
    world.removeCharacterController(controller)
    world.free()
  })
})
