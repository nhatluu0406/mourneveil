import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Vector3Value } from '../game/character/playerMotor'
import { FIXED_STEP_SECONDS } from '../game/core/fixedStepClock'
import { PLAYER_DODGE_ACTION, PLAYER_DODGE_SPEED } from '../game/combat/playerDefense'
import {
  CONNECTED_LEVEL_LANDMARKS,
  activeConnectedLevelColliders,
} from './connectedLevelCollision'
import {
  CHARACTER_COLLISION_OFFSET,
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
  configurePlayerCharacterController,
} from './playerCollisionConfig'

beforeAll(async () => {
  await RAPIER.init()
})

describe('connected landmark Rapier collision', () => {
  it('stops the player outside the watch-column landmark under repeated push', () => {
    const landmark = CONNECTED_LEVEL_LANDMARKS.find((entry) => entry.id === 'landmark.watch-column')!
    const start = {
      x: landmark.position[0],
      y: 0.82,
      z: landmark.position[2] + landmark.size[2] / 2 + PLAYER_CAPSULE_RADIUS + 0.35,
    }
    const fixture = createFixture(start)
    for (let step = 0; step < 90; step += 1) {
      move(fixture, { x: 0, y: 0, z: -0.08 })
    }
    const halfZ = landmark.size[2] / 2
    expect(fixture.position.z).toBeGreaterThanOrEqual(
      landmark.position[2] + halfZ + PLAYER_CAPSULE_RADIUS - 0.05,
    )
    expect(Math.abs(fixture.position.x - landmark.position[0])).toBeLessThan(0.35)
    fixture.free()
  })

  it('stops the player outside the approach-cairn landmark', () => {
    const landmark = CONNECTED_LEVEL_LANDMARKS.find((entry) => entry.id === 'landmark.approach-cairn')!
    const start = {
      x: landmark.position[0],
      y: 0.82,
      z: landmark.position[2] + landmark.size[2] / 2 + PLAYER_CAPSULE_RADIUS + 0.4,
    }
    const fixture = createFixture(start)
    for (let step = 0; step < 90; step += 1) {
      move(fixture, { x: 0, y: 0, z: -0.08 })
    }
    expect(fixture.position.z).toBeGreaterThanOrEqual(
      landmark.position[2] + landmark.size[2] / 2 + PLAYER_CAPSULE_RADIUS - 0.05,
    )
    fixture.free()
  })

  it('blocks diagonal creep into the court obelisk', () => {
    const landmark = CONNECTED_LEVEL_LANDMARKS.find((entry) => entry.id === 'landmark.court-obelisk')!
    const start = {
      x: landmark.position[0] - 1.2,
      y: 0.82,
      z: landmark.position[2] + 1.2,
    }
    const fixture = createFixture(start)
    for (let step = 0; step < 120; step += 1) {
      move(fixture, { x: 0.05, y: 0, z: -0.05 })
    }
    const overlap = horizontalOverlap(fixture.position, landmark, PLAYER_CAPSULE_RADIUS - 0.02)
    expect(overlap).toBe(false)
    fixture.free()
  })

  it('blocks a dodge-length burst into the watch-column', () => {
    const landmark = CONNECTED_LEVEL_LANDMARKS.find((entry) => entry.id === 'landmark.watch-column')!
    const start = {
      x: landmark.position[0],
      y: 0.82,
      z: landmark.position[2] + landmark.size[2] / 2 + PLAYER_CAPSULE_RADIUS + 0.15,
    }
    const fixture = createFixture(start)
    // Production dodge applies PLAYER_DODGE_SPEED across active steps — not one giant translation.
    const step = PLAYER_DODGE_SPEED * FIXED_STEP_SECONDS
    for (let i = 0; i < PLAYER_DODGE_ACTION.activeSteps; i += 1) {
      move(fixture, { x: 0, y: 0, z: -step })
    }
    expect(fixture.position.z).toBeGreaterThanOrEqual(
      landmark.position[2] + landmark.size[2] / 2 + PLAYER_CAPSULE_RADIUS - 0.05,
    )
    fixture.free()
  })

  it('stops an enemy-sized capsule outside the watch-column', () => {
    const landmark = CONNECTED_LEVEL_LANDMARKS.find((entry) => entry.id === 'landmark.watch-column')!
    const enemyRadius = 0.32
    const enemyHalfHeight = 0.55
    const start = {
      x: landmark.position[0],
      y: 0.82,
      z: landmark.position[2] + landmark.size[2] / 2 + enemyRadius + 0.4,
    }
    const fixture = createFixture(start, { radius: enemyRadius, halfHeight: enemyHalfHeight })
    for (let step = 0; step < 90; step += 1) {
      move(fixture, { x: 0, y: 0, z: -0.08 })
    }
    expect(fixture.position.z).toBeGreaterThanOrEqual(
      landmark.position[2] + landmark.size[2] / 2 + enemyRadius - 0.05,
    )
    fixture.free()
  })
})

function createFixture(
  initial: Vector3Value,
  capsule: { readonly radius: number; readonly halfHeight: number } = {
    radius: PLAYER_CAPSULE_RADIUS,
    halfHeight: PLAYER_CAPSULE_HALF_HEIGHT,
  },
) {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  for (const box of activeConnectedLevelColliders({
    shortcutOpen: false,
    finalGateOpen: false,
  })) {
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(box.size[0] / 2, box.size[1] / 2, box.size[2] / 2).setTranslation(
        box.position[0],
        box.position[1],
        box.position[2],
      ),
    )
  }
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(initial.x, initial.y, initial.z),
  )
  const collider = world.createCollider(
    RAPIER.ColliderDesc.capsule(capsule.halfHeight, capsule.radius),
    body,
  )
  const controller = world.createCharacterController(CHARACTER_COLLISION_OFFSET)
  configurePlayerCharacterController(controller)
  return {
    world,
    body,
    collider,
    controller,
    position: { ...initial },
    free() {
      world.free()
    },
  }
}

function move(
  fixture: ReturnType<typeof createFixture>,
  desired: Vector3Value,
): void {
  fixture.body.setTranslation(fixture.position, false)
  fixture.controller.computeColliderMovement(fixture.collider, desired)
  const translation = fixture.controller.computedMovement()
  fixture.position = {
    x: fixture.position.x + translation.x,
    y: fixture.position.y + translation.y,
    z: fixture.position.z + translation.z,
  }
  fixture.body.setTranslation(fixture.position, false)
  fixture.world.step()
}

function horizontalOverlap(
  position: Vector3Value,
  box: { readonly position: readonly [number, number, number]; readonly size: readonly [number, number, number] },
  radius: number,
): boolean {
  const dx = Math.max(Math.abs(position.x - box.position[0]) - box.size[0] / 2, 0)
  const dz = Math.max(Math.abs(position.z - box.position[2]) - box.size[2] / 2, 0)
  return Math.hypot(dx, dz) < radius
}
