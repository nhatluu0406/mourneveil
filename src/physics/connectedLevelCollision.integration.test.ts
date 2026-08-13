import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Vector3Value } from '../game/character/playerMotor'
import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from '../game/world/checkpoint'
import { activeConnectedLevelColliders } from './connectedLevelCollision'
import {
  CHARACTER_COLLISION_OFFSET,
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
  configurePlayerCharacterController,
} from './playerCollisionConfig'

beforeAll(async () => {
  await RAPIER.init()
})

describe('connected graybox Rapier collision', () => {
  it('supports the intended entry-to-final-gate long route without wall penetration', () => {
    const fixture = createFixture({ shortcutOpen: false, finalGateOpen: false }, { x: -14, y: 0.82, z: 6 })
    const route = [
      { x: -14, y: 0.82, z: 6 },
      { x: -12.4, y: 0.82, z: 6 },
      { x: -12.4, y: 0.82, z: 4.2 },
      { x: -11.5, y: 0.82, z: 4.2 },
      { x: -10.4, y: 0.82, z: 3.8 },
      { x: -10, y: 0.82, z: 2 },
      { x: -8, y: 0.82, z: 1 },
      CONNECTED_LEVEL_CHECKPOINT_DEFINITION.interactionPosition,
      { x: -5.5, y: 0.82, z: -3.6 },
      { x: -1, y: 0.82, z: -4 },
      { x: 2.4, y: 0.82, z: -4 },
      { x: 5.5, y: 0.82, z: -4 },
      { x: 8.4, y: 0.82, z: -4 },
    ]
    for (const waypoint of route) {
      expect(moveToward(fixture, waypoint), `reach ${JSON.stringify(waypoint)}`).toBe(true)
    }
    expect(Math.abs(fixture.position.x - 8.4)).toBeLessThan(0.2)
    fixture.free()
  })

  it('blocks the closed shortcut and final gate while their opened states are traversable', () => {
    const closedShortcut = createFixture(
      { shortcutOpen: false, finalGateOpen: false },
      { x: -2, y: 0.82, z: -1.3 },
    )
    expect(moveToward(closedShortcut, { x: -5, y: 0.82, z: -1.3 }, 80)).toBe(false)
    expect(closedShortcut.position.x).toBeGreaterThan(-2.6)
    closedShortcut.free()

    const openedShortcut = createFixture(
      { shortcutOpen: true, finalGateOpen: false },
      { x: -1.6, y: 0.82, z: -2 },
    )
    expect(moveToward(openedShortcut, { x: -3.7, y: 0.82, z: -1.2 }, 160)).toBe(true)
    openedShortcut.free()

    const closedFinal = createFixture(
      { shortcutOpen: true, finalGateOpen: false },
      { x: 9, y: 0.82, z: -4 },
    )
    expect(moveToward(closedFinal, { x: 13, y: 0.82, z: -4 }, 100)).toBe(false)
    expect(closedFinal.position.x).toBeLessThan(9.6)
    closedFinal.free()

    const openedFinal = createFixture(
      { shortcutOpen: true, finalGateOpen: true },
      { x: 9, y: 0.82, z: -4 },
    )
    expect(moveToward(openedFinal, { x: 13, y: 0.82, z: -4 })).toBe(true)
    openedFinal.free()
  })

  it('keeps the player capsule inside the perimeter boundary', () => {
    const fixture = createFixture(
      { shortcutOpen: true, finalGateOpen: true },
      { x: 14.4, y: 0.82, z: -4 },
    )
    expect(moveToward(fixture, { x: 20, y: 0.82, z: -4 }, 100)).toBe(false)
    expect(fixture.position.x).toBeLessThanOrEqual(16.15)
    fixture.free()
  })
})

function createFixture(
  flags: { readonly shortcutOpen: boolean; readonly finalGateOpen: boolean },
  initial: Vector3Value,
) {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  for (const box of activeConnectedLevelColliders(flags)) {
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(box.size[0] / 2, box.size[1] / 2, box.size[2] / 2)
        .setTranslation(box.position[0], box.position[1], box.position[2]),
    )
  }
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(initial.x, initial.y, initial.z),
  )
  const collider = world.createCollider(
    RAPIER.ColliderDesc.capsule(PLAYER_CAPSULE_HALF_HEIGHT, PLAYER_CAPSULE_RADIUS),
    body,
  )
  const controller = world.createCharacterController(CHARACTER_COLLISION_OFFSET)
  configurePlayerCharacterController(controller)
  const fixture = {
    world,
    body,
    collider,
    controller,
    position: { ...initial },
    free: () => {
      world.removeCharacterController(controller)
      world.free()
    },
  }
  return fixture
}

function moveToward(
  fixture: ReturnType<typeof createFixture>,
  target: Vector3Value,
  maximumSteps = 240,
): boolean {
  for (let step = 0; step < maximumSteps; step += 1) {
    const deltaX = target.x - fixture.position.x
    const deltaZ = target.z - fixture.position.z
    const distance = Math.hypot(deltaX, deltaZ)
    if (distance <= 0.12) return true
    const travel = Math.min(0.08, distance)
    fixture.body.setTranslation(fixture.position, false)
    fixture.controller.computeColliderMovement(fixture.collider, {
      x: deltaX / distance * travel,
      y: 0,
      z: deltaZ / distance * travel,
    })
    const movement = fixture.controller.computedMovement()
    fixture.position = {
      x: fixture.position.x + movement.x,
      y: fixture.position.y + movement.y,
      z: fixture.position.z + movement.z,
    }
    fixture.body.setTranslation(fixture.position, false)
    fixture.world.step()
  }
  return Math.hypot(target.x - fixture.position.x, target.z - fixture.position.z) <= 0.12
}
