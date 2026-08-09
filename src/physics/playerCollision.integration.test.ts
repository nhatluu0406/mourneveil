import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../game/core/fixedStepClock'
import {
  createPlayerMotorState,
  stepPlayerMotor,
  stepPlayerDodgeMotor,
  type CharacterCollisionResolver,
} from '../game/character/playerMotor'
import { GRAYBOX_CENTER_BLOCKER_SIZE } from './grayboxCollision'
import {
  CHARACTER_COLLISION_OFFSET,
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
  configurePlayerCharacterController,
} from './playerCollisionConfig'
import {
  MELEE_ENEMY_DEFINITION,
  advanceMeleeEnemy,
  createMeleeEnemyRuntime,
} from '../game/enemies/meleeEnemy'
import { configureCharacterController } from './playerCollisionConfig'

beforeAll(async () => {
  await RAPIER.init()
})

describe('graybox player collision', () => {
  it('keeps authoritative enemy pursuit outside a solid blocker', () => {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
    world.timestep = FIXED_STEP_SECONDS
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(6, 0.25, 6).setTranslation(0, -0.25, 0),
    )
    const wallCenterX = 1.5
    const wallHalfWidth = 0.25
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(wallHalfWidth, 0.75, 2).setTranslation(
        wallCenterX,
        0.75,
        3,
      ),
    )
    const enemy = createMeleeEnemyRuntime()
    const initial = enemy.snapshot().position
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        initial.x,
        initial.y,
        initial.z,
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
    const resolveCollision: CharacterCollisionResolver = (position, desired) => {
      body.setTranslation(position, false)
      controller.computeColliderMovement(collider, desired)
      const translation = controller.computedMovement()
      body.setTranslation(
        {
          x: position.x + translation.x,
          y: position.y + translation.y,
          z: position.z + translation.z,
        },
        false,
      )
      return {
        translation: { x: translation.x, y: translation.y, z: translation.z },
        grounded: controller.computedGrounded(),
      }
    }

    for (let step = 0; step < 180; step += 1) {
      advanceMeleeEnemy(
        enemy,
        { x: 0, y: 0.82, z: 3 },
        FIXED_STEP_SECONDS,
        resolveCollision,
      )
      world.step()
    }

    const wallRightFace = wallCenterX + wallHalfWidth
    expect(enemy.snapshot().state).toBe('pursue')
    expect(
      enemy.snapshot().position.x - MELEE_ENEMY_DEFINITION.body.radius - wallRightFace,
    ).toBeGreaterThanOrEqual(CHARACTER_COLLISION_OFFSET - 0.001)
    world.removeCharacterController(controller)
    world.free()
  })

  it('uses Rapier-corrected movement without penetrating the center blocker', () => {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
    world.timestep = FIXED_STEP_SECONDS
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(6, 0.25, 6).setTranslation(0, -0.25, 0),
    )
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        GRAYBOX_CENTER_BLOCKER_SIZE.x / 2,
        GRAYBOX_CENTER_BLOCKER_SIZE.y / 2,
        GRAYBOX_CENTER_BLOCKER_SIZE.z / 2,
      ).setTranslation(0, GRAYBOX_CENTER_BLOCKER_SIZE.y / 2, 0),
    )

    const initialPosition = { x: 0, y: 0.82, z: 3 }
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        initialPosition.x,
        initialPosition.y,
        initialPosition.z,
      ),
    )
    const collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(
        PLAYER_CAPSULE_HALF_HEIGHT,
        PLAYER_CAPSULE_RADIUS,
      ),
      body,
    )
    const controller = world.createCharacterController(
      CHARACTER_COLLISION_OFFSET,
    )
    configurePlayerCharacterController(controller)

    let state = createPlayerMotorState(initialPosition)
    let observedBlockedMovement = false
    let minimumSurfaceGap = Number.POSITIVE_INFINITY
    const blockerFace = GRAYBOX_CENTER_BLOCKER_SIZE.z / 2
    const resolveCollision: CharacterCollisionResolver = (
      position,
      desiredTranslation,
    ) => {
      body.setTranslation(position, false)
      controller.computeColliderMovement(collider, desiredTranslation)
      const corrected = controller.computedMovement()
      const nextPosition = {
        x: position.x + corrected.x,
        y: position.y + corrected.y,
        z: position.z + corrected.z,
      }
      body.setTranslation(nextPosition, false)

      if (
        desiredTranslation.z < -0.01 &&
        corrected.z > desiredTranslation.z + 0.01
      ) {
        observedBlockedMovement = true
      }

      return {
        translation: { x: corrected.x, y: corrected.y, z: corrected.z },
        grounded: controller.computedGrounded(),
      }
    }

    for (let step = 0; step < 240; step += 1) {
      state = stepPlayerMotor(
        state,
        { horizontal: 0, forward: 1 },
        FIXED_STEP_SECONDS,
        resolveCollision,
      )
      world.step()

      if (observedBlockedMovement) {
        minimumSurfaceGap = Math.min(
          minimumSurfaceGap,
          state.position.z - PLAYER_CAPSULE_RADIUS - blockerFace,
        )
      }
    }

    expect(observedBlockedMovement).toBe(true)
    expect(state.grounded).toBe(true)
    expect(minimumSurfaceGap).toBeGreaterThanOrEqual(
      CHARACTER_COLLISION_OFFSET - 0.001,
    )

    world.removeCharacterController(controller)
    world.free()
  })

  it('keeps authoritative dodge movement outside a solid boundary', () => {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
    world.timestep = FIXED_STEP_SECONDS
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(6, 0.25, 6).setTranslation(0, -0.25, 0),
    )
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.25, 0.75, 6).setTranslation(1.25, 0.75, 0),
    )
    const initialPosition = { x: 0, y: 0.82, z: 0 }
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.82, 0),
    )
    const collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(
        PLAYER_CAPSULE_HALF_HEIGHT,
        PLAYER_CAPSULE_RADIUS,
      ),
      body,
    )
    const controller = world.createCharacterController(CHARACTER_COLLISION_OFFSET)
    configurePlayerCharacterController(controller)
    const resolveCollision: CharacterCollisionResolver = (position, desired) => {
      body.setTranslation(position, false)
      controller.computeColliderMovement(collider, desired)
      const corrected = controller.computedMovement()
      body.setTranslation(
        {
          x: position.x + corrected.x,
          y: position.y + corrected.y,
          z: position.z + corrected.z,
        },
        false,
      )
      return {
        translation: { x: corrected.x, y: corrected.y, z: corrected.z },
        grounded: controller.computedGrounded(),
      }
    }

    let state = createPlayerMotorState(initialPosition)
    for (let step = 0; step < 30; step += 1) {
      state = stepPlayerDodgeMotor(
        state,
        { x: 1, z: 0 },
        8,
        FIXED_STEP_SECONDS,
        resolveCollision,
      )
      world.step()
    }

    const boundaryFace = 1
    expect(state.position.x + PLAYER_CAPSULE_RADIUS).toBeLessThanOrEqual(
      boundaryFace - CHARACTER_COLLISION_OFFSET + 0.001,
    )
    expect(state.grounded).toBe(true)
    world.removeCharacterController(controller)
    world.free()
  })
})
