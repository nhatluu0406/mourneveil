import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../game/core/fixedStepClock'
import {
  createPlayerMotorState,
  stepPlayerMotor,
  type CharacterCollisionResolver,
} from '../game/character/playerMotor'
import { GRAYBOX_CENTER_BLOCKER_SIZE } from './grayboxCollision'
import {
  CHARACTER_COLLISION_OFFSET,
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
  configurePlayerCharacterController,
} from './playerCollisionConfig'

beforeAll(async () => {
  await RAPIER.init()
})

describe('graybox player collision', () => {
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
})
