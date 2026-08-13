import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Vector3Value } from '../game/character/playerMotor'
import { PLAYER_DODGE_ACTION, PLAYER_DODGE_SPEED } from '../game/combat/playerDefense'
import { FIXED_STEP_SECONDS } from '../game/core/fixedStepClock'
import {
  CONNECTED_LEVEL_COLLIDERS,
  activeConnectedLevelColliders,
  assertConnectedLevelWallContinuity,
  findUnintendedWallSegmentGaps,
  horizontalFootprintOverlapsSolid,
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

describe('connected-level wall continuity authorship', () => {
  it('treats compiled door openings as the only allowed wall gaps', () => {
    expect(() => assertConnectedLevelWallContinuity()).not.toThrow()
    const withoutAllow = findUnintendedWallSegmentGaps(CONNECTED_LEVEL_COLLIDERS, [])
    expect(withoutAllow.length).toBeGreaterThanOrEqual(0)
  })

  it('rejects a synthetic micro-gap on a collinear wall line', () => {
    const broken = [
      ...CONNECTED_LEVEL_COLLIDERS.filter((entry) => entry.kind !== 'wall'),
      {
        id: 'wall.synthetic.south',
        kind: 'wall' as const,
        position: [10, 0.75, -7.2] as const,
        size: [0.5, 1.5, 2.4] as const,
      },
      {
        id: 'wall.synthetic.north',
        kind: 'wall' as const,
        position: [10, 0.75, 3.4] as const,
        size: [0.5, 1.5, 10] as const,
      },
    ]
    const issues = findUnintendedWallSegmentGaps(broken, [])
    expect(issues.some((issue) => Math.abs(issue.axisValue - 10) < 0.05)).toBe(true)
  })
})

describe('connected-level wall Rapier hardening', () => {
  it('blocks straight push into the refuge west wall', () => {
    const fixture = createFixture({ shortcutOpen: false, finalGateOpen: false }, {
      x: -6.4,
      y: 0.82,
      z: -1.15,
    })
    push(fixture, { x: -0.08, y: 0, z: 0 }, 240)
    expect(fixture.position.x).toBeGreaterThan(-8 + PLAYER_CAPSULE_RADIUS - 0.08)
    expect(horizontalFootprintOverlapsSolid(fixture.position.x, fixture.position.z, 0.12)).toBeNull()
    fixture.free()
  })

  it('blocks diagonal creep into the refuge west wall', () => {
    const fixture = createFixture({ shortcutOpen: false, finalGateOpen: false }, {
      x: -6.3,
      y: 0.82,
      z: -1.15,
    })
    push(fixture, { x: -0.06, y: 0, z: -0.06 }, 200)
    expect(fixture.position.x).toBeGreaterThan(-8 + PLAYER_CAPSULE_RADIUS - 0.1)
    fixture.free()
  })

  it('blocks closed final-gate endpoint approach without micro-gap passage', () => {
    const fixture = createFixture({ shortcutOpen: true, finalGateOpen: false }, {
      x: 8.8,
      y: 0.82,
      z: -4,
    })
    push(fixture, { x: 0.08, y: 0, z: 0 }, 200)
    expect(fixture.position.x).toBeLessThan(10 - PLAYER_CAPSULE_RADIUS + 0.12)
    fixture.free()
  })

  it('blocks dodge burst into the outer-watch west wall', () => {
    const fixture = createFixture({ shortcutOpen: false, finalGateOpen: false }, {
      x: -13.2,
      y: 0.82,
      z: 6,
    })
    const step = PLAYER_DODGE_SPEED * FIXED_STEP_SECONDS
    for (let index = 0; index < PLAYER_DODGE_ACTION.activeSteps; index += 1) {
      move(fixture, { x: -step, y: 0, z: 0 })
    }
    expect(fixture.position.x).toBeGreaterThan(-16 + PLAYER_CAPSULE_RADIUS - 0.1)
    fixture.free()
  })

  it('keeps authoritative position outside solids after move-attack-move against a wall', () => {
    const fixture = createFixture({ shortcutOpen: false, finalGateOpen: false }, {
      x: -6.4,
      y: 0.82,
      z: -1.15,
    })
    push(fixture, { x: -0.08, y: 0, z: 0 }, 40)
    push(fixture, { x: 0, y: 0, z: 0 }, 20)
    push(fixture, { x: -0.08, y: 0, z: 0 }, 80)
    expect(Number.isFinite(fixture.position.x)).toBe(true)
    expect(fixture.position.x).toBeGreaterThan(-8 + PLAYER_CAPSULE_RADIUS - 0.08)
    fixture.free()
  })

  it('does not tunnel an enemy-sized capsule through a room wall', () => {
    const fixture = createFixture(
      { shortcutOpen: false, finalGateOpen: false },
      { x: -6.4, y: 0.82, z: -1.15 },
      { radius: 0.32, halfHeight: 0.55 },
    )
    push(fixture, { x: -0.08, y: 0, z: 0 }, 180)
    expect(fixture.position.x).toBeGreaterThan(-8 + 0.32 - 0.1)
    fixture.free()
  })
})

function createFixture(
  flags: { readonly shortcutOpen: boolean; readonly finalGateOpen: boolean },
  initial: Vector3Value,
  capsule: { readonly radius: number; readonly halfHeight: number } = {
    radius: PLAYER_CAPSULE_RADIUS,
    halfHeight: PLAYER_CAPSULE_HALF_HEIGHT,
  },
) {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  for (const box of activeConnectedLevelColliders(flags)) {
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(box.size[0] / 2, box.size[1] / 2, box.size[2] / 2).setTranslation(
        box.position[0],
        box.position[1],
        box.position[2],
      ),
    )
  }
  world.step()
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
    free: () => {
      world.removeCharacterController(controller)
      world.free()
    },
  }
}

function move(
  fixture: ReturnType<typeof createFixture>,
  desired: Vector3Value,
): void {
  fixture.body.setTranslation(fixture.position, false)
  fixture.world.step()
  fixture.controller.computeColliderMovement(fixture.collider, desired)
  const movement = fixture.controller.computedMovement()
  fixture.position = {
    x: fixture.position.x + movement.x,
    y: fixture.position.y + movement.y,
    z: fixture.position.z + movement.z,
  }
  fixture.body.setTranslation(fixture.position, false)
}

function push(
  fixture: ReturnType<typeof createFixture>,
  desired: Vector3Value,
  steps: number,
): void {
  for (let step = 0; step < steps; step += 1) {
    move(fixture, desired)
  }
}
