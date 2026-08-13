import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import { OSSUARY_DUNGEON } from '../content/world/dungeons/ossuary/OssuaryDungeon'
import { type DungeonRoomDefinition } from '../content/world/dungeonTypes'
import { M5_ENEMY_PLACEMENTS } from '../game/encounters/connectedLevelEncounters'
import {
  CHARACTER_COLLISION_OFFSET,
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
  configureCharacterController,
  configurePlayerCharacterController,
} from './playerCollisionConfig'
import { activeConnectedLevelColliders } from './connectedLevelCollision'
import { MELEE_ENEMY_DEFINITION } from '../game/enemies/meleeEnemy'

beforeAll(async () => {
  await RAPIER.init()
})

describe('dungeon room player collision', () => {
  it.each(OSSUARY_DUNGEON.rooms.map((room) => [room.id, room] as const))(
    'keeps the player capsule inside %s walls, corners, and door edges',
    (_id, room) => {
      const floor = room.floors[0]!
      const interior = {
        x: (floor.minX + floor.maxX) / 2,
        y: 0.82,
        z: (floor.minZ + floor.maxZ) / 2,
      }
      const fixture = createPlayerFixture(interior)
      const openWest = room.openings.some((entry) => entry.side === 'west')
      const openEast = room.openings.some((entry) => entry.side === 'east')
      const openSouth = room.openings.some((entry) => entry.side === 'south')
      const openNorth = room.openings.some((entry) => entry.side === 'north')
      const solidPushes: Array<{ x: number; z: number }> = []
      if (!openWest) solidPushes.push({ x: -0.08, z: 0 })
      if (!openEast) solidPushes.push({ x: 0.08, z: 0 })
      if (!openSouth) solidPushes.push({ x: 0, z: -0.08 })
      if (!openNorth) solidPushes.push({ x: 0, z: 0.08 })
      if (!openWest && !openSouth) solidPushes.push({ x: -0.06, z: -0.06 })
      if (!openEast && !openNorth) solidPushes.push({ x: 0.06, z: 0.06 })
      for (const push of solidPushes) {
        fixture.position.x = interior.x
        fixture.position.z = interior.z
        fixture.body.setTranslation(fixture.position, false)
        for (let step = 0; step < 90; step += 1) move(fixture, { x: push.x, y: 0, z: push.z })
        expect(centerInsideExpandedRoom(fixture.position.x, fixture.position.z, room, 0.55)).toBe(true)
        expect(insideAnyRoom(fixture.position.x, fixture.position.z, 0.2)).toBe(true)
      }
      fixture.free()
    },
  )
})

describe('dungeon room enemy collision', () => {
  it('blocks a skirmisher from tunneling through the outer-watch east wall', () => {
    const fixture = createEnemyFixture({ x: -9.2, y: 0.82, z: 3.2 })
    for (let step = 0; step < 160; step += 1) move(fixture, { x: 0.08, y: 0, z: 0 })
    expect(fixture.position.x).toBeLessThan(-8 + MELEE_ENEMY_DEFINITION.body.radius + 0.12)
    fixture.free()
  })

  it('allows a skirmisher through the authored watch-refuge doorway', () => {
    const fixture = createEnemyFixture({ x: -9.2, y: 0.82, z: 1 })
    for (let step = 0; step < 200; step += 1) move(fixture, { x: 0.08, y: 0, z: 0 })
    expect(fixture.position.x).toBeGreaterThan(-8)
    fixture.free()
  })

  it('blocks a brute from tunneling through the mixed-court south wall', () => {
    const fixture = createEnemyFixture({ x: 2.6, y: 0.82, z: -5.2 })
    for (let step = 0; step < 160; step += 1) move(fixture, { x: 0, y: 0, z: -0.08 })
    expect(fixture.position.z).toBeGreaterThan(-7 - 0.12)
    fixture.free()
  })

  it('keeps authored enemy spawns on the walkable side of structural walls', () => {
    for (const placement of M5_ENEMY_PLACEMENTS) {
      expect(
        centerInsideExpandedRoom(placement.spawnPosition.x, placement.spawnPosition.z, roomContaining(placement.spawnPosition.x, placement.spawnPosition.z), 0.2),
      ).toBe(true)
    }
  })
})

function roomContaining(x: number, z: number): DungeonRoomDefinition {
  const room = OSSUARY_DUNGEON.rooms.find((entry) =>
    entry.floors.some(
      (floor) => x >= floor.minX - 0.2 && x <= floor.maxX + 0.2 && z >= floor.minZ - 0.2 && z <= floor.maxZ + 0.2,
    ),
  )
  if (room === undefined) throw new Error(`No room contains ${x},${z}`)
  return room
}

function insideAnyRoom(x: number, z: number, slop: number): boolean {
  return OSSUARY_DUNGEON.rooms.some((room) => centerInsideExpandedRoom(x, z, room, slop))
}

function centerInsideExpandedRoom(
  x: number,
  z: number,
  room: DungeonRoomDefinition,
  slop: number,
): boolean {
  return room.floors.some(
    (floor) =>
      x >= floor.minX - slop && x <= floor.maxX + slop && z >= floor.minZ - slop && z <= floor.maxZ + slop,
  )
}

function createPlayerFixture(initial: { x: number; y: number; z: number }) {
  return createCapsuleFixture(initial, PLAYER_CAPSULE_RADIUS, PLAYER_CAPSULE_HALF_HEIGHT, true)
}

function createEnemyFixture(initial: { x: number; y: number; z: number }) {
  return createCapsuleFixture(
    initial,
    MELEE_ENEMY_DEFINITION.body.radius,
    MELEE_ENEMY_DEFINITION.body.halfHeight,
    false,
  )
}

function createCapsuleFixture(
  initial: { x: number; y: number; z: number },
  radius: number,
  halfHeight: number,
  player: boolean,
) {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  for (const box of activeConnectedLevelColliders({ shortcutOpen: false, finalGateOpen: false })) {
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
  const collider = world.createCollider(RAPIER.ColliderDesc.capsule(halfHeight, radius), body)
  const controller = world.createCharacterController(CHARACTER_COLLISION_OFFSET)
  if (player) configurePlayerCharacterController(controller)
  else configureCharacterController(controller)
  return {
    position: { ...initial },
    body,
    collider,
    controller,
    world,
    free: () => {
      world.removeCharacterController(controller)
      world.free()
    },
  }
}

function move(
  fixture: ReturnType<typeof createCapsuleFixture>,
  desired: { x: number; y: number; z: number },
): void {
  fixture.body.setTranslation(fixture.position, false)
  fixture.controller.computeColliderMovement(fixture.collider, desired)
  const movement = fixture.controller.computedMovement()
  fixture.position = {
    x: fixture.position.x + movement.x,
    y: fixture.position.y + movement.y,
    z: fixture.position.z + movement.z,
  }
  fixture.body.setTranslation(fixture.position, false)
  fixture.world.step()
}
