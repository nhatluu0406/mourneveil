import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  CombatContactRuntime,
  type ActiveCombatContactShape,
} from '../game/combat/combatContact'
import type { SphereHurtbox } from '../game/combat/combatTarget'
import { PlayerHealthRuntime } from '../game/character/playerHealth'
import {
  MELEE_ENEMY_ATTACK,
  createEnemyAttackSpatialSnapshot,
  createMeleeEnemyRuntime,
} from '../game/enemies/meleeEnemy'
import {
  PLAYER_LIGHT_ATTACK,
  transformPlayerAttackContactShape,
} from '../game/combat/playerAttackActions'
import { TrainingTargetRuntime, defineTrainingTarget } from '../game/combat/trainingTarget'
import { createRapierCombatContactQuery } from './combatContactQuery'
import { createRapierCombatOcclusionQuery } from './combatOcclusionQuery'
import { activeConnectedLevelColliders } from './connectedLevelCollision'

beforeAll(async () => {
  await RAPIER.init()
})

describe('Rapier melee solid-world occlusion', () => {
  it('allows an unobstructed player attack and rejects the same attack through a wall', () => {
    const fixture = createWallFixture()
    const openTarget = createTarget('open-target', { x: 2.2, y: 0.82, z: 0 })
    const blockedTarget = createTarget('blocked-target', { x: -1.2, y: 0.82, z: 0 })
    fixture.register(openTarget)
    fixture.register(blockedTarget)

    const shape = transformPlayerAttackContactShape(
      PLAYER_LIGHT_ATTACK.contactShape,
      { x: 1.2, y: 0.82, z: 0 },
      { x: 1, z: 0 },
    )
    const contacts = new CombatContactRuntime()
    const combat = startPlayerLightActive()

    expect(
      contacts.resolvePlayerContact({
        combat,
        attack: {
          movementConstrained: true,
          executionFacing: { x: 1, z: 0 },
          contactShapeId: shape.id,
          activeContactShape: {
            ...PLAYER_LIGHT_ATTACK.contactShape,
            center: shape.center,
            facing: { x: 1, z: 0 },
          },
        },
        simulationStep: 20,
        targets: [openTarget.runtime],
        query: fixture.query,
        attackOrigin: { x: 1.2, y: 0.82, z: 0 },
        occlusionQuery: fixture.occlusion,
      }),
    ).toHaveLength(1)

    const blockedContacts = new CombatContactRuntime()
    const overlappingThroughWall: ActiveCombatContactShape = {
      id: PLAYER_LIGHT_ATTACK.contactShape.id,
      kind: 'sphere',
      actionId: PLAYER_LIGHT_ATTACK.contactShape.actionId,
      windowId: PLAYER_LIGHT_ATTACK.contactShape.windowId,
      center: { x: -0.15, y: 0.82, z: 0 },
      radius: 1.2,
    }
    expect(
      fixture.query({
        contactShape: overlappingThroughWall,
        hurtboxes: [blockedTarget.runtime.snapshot().hurtbox],
      }),
    ).toHaveLength(1)
    expect(fixture.occlusion({ origin: { x: 1.2, y: 0.82, z: 0 }, target: { x: -1.2, y: 0.82, z: 0 } })).toBe(
      'blocked',
    )
    expect(
      blockedContacts.resolvePlayerContact({
        combat,
        attack: {
          movementConstrained: true,
          executionFacing: { x: -1, z: 0 },
          contactShapeId: overlappingThroughWall.id,
          activeContactShape: {
            ...PLAYER_LIGHT_ATTACK.contactShape,
            center: overlappingThroughWall.center,
            facing: { x: -1, z: 0 },
          },
        },
        simulationStep: 21,
        targets: [blockedTarget.runtime],
        query: fixture.query,
        attackOrigin: { x: 1.2, y: 0.82, z: 0 },
        occlusionQuery: fixture.occlusion,
      }),
    ).toEqual([])

    fixture.free()
  })

  it('rejects enemy→player contact through a solid wall and allows it through an open gate gap', () => {
    const closed = createLevelFixture({ shortcutOpen: false, finalGateOpen: false })
    const player = new PlayerHealthRuntime({ x: -3.55, y: 0.82, z: -1.3 })
    closed.registerPlayer(player)

    const enemy = createMeleeEnemyRuntime()
    enemy.reset({ x: -2.45, y: 0.82, z: -1.3 })
    enemy.transition('pursue', 'player')
    enemy.startAction(MELEE_ENEMY_ATTACK.id, { x: -1, z: 0 })
    for (let step = 0; step < MELEE_ENEMY_ATTACK.startupSteps; step += 1) {
      enemy.advanceAction()
    }
    const attack = createEnemyAttackSpatialSnapshot(enemy.snapshot())
    const shape: ActiveCombatContactShape = {
      ...attack.activeContactShape!,
      center: { x: -3.0, y: 0.82, z: -1.3 },
      radius: 0.9,
    }
    expect(
      closed.query({ contactShape: shape, hurtboxes: [player.snapshot().hurtbox] }),
    ).toHaveLength(1)
    expect(
      closed.occlusion({
        origin: enemy.snapshot().position,
        target: player.snapshot().hurtbox.center,
      }),
    ).toBe('blocked')

    const contacts = new CombatContactRuntime()
    expect(
      contacts.resolveContact({
        attackerId: enemy.id,
        combat: enemy.snapshot().action,
        contactShape: shape,
        simulationStep: 40,
        targets: [player],
        query: closed.query,
        damage: 10,
        attackOrigin: enemy.snapshot().position,
        occlusionQuery: closed.occlusion,
      }),
    ).toEqual([])
    closed.free()

    const open = createLevelFixture({ shortcutOpen: true, finalGateOpen: false })
    const openPlayer = new PlayerHealthRuntime({ x: -3.55, y: 0.82, z: -1.3 })
    open.registerPlayer(openPlayer)
    const openContacts = new CombatContactRuntime()
    const openEnemy = createMeleeEnemyRuntime()
    openEnemy.reset({ x: -2.45, y: 0.82, z: -1.3 })
    openEnemy.transition('pursue', 'player')
    openEnemy.startAction(MELEE_ENEMY_ATTACK.id, { x: -1, z: 0 })
    for (let step = 0; step < MELEE_ENEMY_ATTACK.startupSteps; step += 1) {
      openEnemy.advanceAction()
    }
    expect(
      open.occlusion({
        origin: openEnemy.snapshot().position,
        target: openPlayer.snapshot().hurtbox.center,
      }),
    ).toBe('clear')
    expect(
      openContacts.resolveContact({
        attackerId: openEnemy.id,
        combat: openEnemy.snapshot().action,
        contactShape: shape,
        simulationStep: 41,
        targets: [openPlayer],
        query: open.query,
        damage: 10,
        attackOrigin: openEnemy.snapshot().position,
        occlusionQuery: open.occlusion,
      }),
    ).toHaveLength(1)
    open.free()
  })

  it('blocks introduction melee through the watch-column landmark solid', () => {
    const fixture = createLevelFixture({ shortcutOpen: false, finalGateOpen: false })
    const player = new PlayerHealthRuntime({ x: -10.4, y: 0.82, z: 1.2 })
    fixture.registerPlayer(player)
    const attacker = { x: -10.2, y: 0.82, z: 2.55 }
    expect(
      fixture.occlusion({
        origin: attacker,
        target: player.snapshot().hurtbox.center,
      }),
    ).toBe('blocked')

    const enemy = createMeleeEnemyRuntime()
    enemy.reset(attacker)
    enemy.transition('pursue', 'player')
    enemy.startAction(MELEE_ENEMY_ATTACK.id, { x: 0, z: -1 })
    for (let step = 0; step < MELEE_ENEMY_ATTACK.startupSteps; step += 1) {
      enemy.advanceAction()
    }
    const attack = createEnemyAttackSpatialSnapshot(enemy.snapshot())
    const shape: ActiveCombatContactShape = {
      ...attack.activeContactShape!,
      center: { x: -10.4, y: 0.82, z: 1.55 },
      radius: 1.1,
    }
    expect(
      fixture.query({ contactShape: shape, hurtboxes: [player.snapshot().hurtbox] }),
    ).toHaveLength(1)
    const contacts = new CombatContactRuntime()
    expect(
      contacts.resolveContact({
        attackerId: enemy.id,
        combat: enemy.snapshot().action,
        contactShape: shape,
        simulationStep: 90,
        targets: [player],
        query: fixture.query,
        damage: 12,
        attackOrigin: attacker,
        occlusionQuery: fixture.occlusion,
      }),
    ).toEqual([])
    fixture.free()
  })

  it('keeps one-hit-per-execution across multiple active steps when clear', () => {
    const fixture = createWallFixture()
    const target = createTarget('once-target', { x: 2.2, y: 0.82, z: 0 })
    fixture.register(target)
    const shape = transformPlayerAttackContactShape(
      PLAYER_LIGHT_ATTACK.contactShape,
      { x: 1.2, y: 0.82, z: 0 },
      { x: 1, z: 0 },
    )
    const contacts = new CombatContactRuntime()
    const combat = startPlayerLightActive()
    const attack = {
      movementConstrained: true,
      executionFacing: { x: 1, z: 0 } as const,
      contactShapeId: shape.id,
      activeContactShape: {
        ...PLAYER_LIGHT_ATTACK.contactShape,
        center: shape.center,
        facing: { x: 1, z: 0 },
      },
    }
    expect(
      contacts.resolvePlayerContact({
        combat,
        attack,
        simulationStep: 10,
        targets: [target.runtime],
        query: fixture.query,
        attackOrigin: { x: 1.2, y: 0.82, z: 0 },
        occlusionQuery: fixture.occlusion,
      }),
    ).toHaveLength(1)
    expect(
      contacts.resolvePlayerContact({
        combat,
        attack,
        simulationStep: 11,
        targets: [target.runtime],
        query: fixture.query,
        attackOrigin: { x: 1.2, y: 0.82, z: 0 },
        occlusionQuery: fixture.occlusion,
      }),
    ).toEqual([])
    fixture.free()
  })

  it('misses perpendicular/away attacks even without a wall', () => {
    const fixture = createWallFixture()
    const target = createTarget('away-target', { x: 2.2, y: 0.82, z: 0 })
    fixture.register(target)
    const away = transformPlayerAttackContactShape(
      PLAYER_LIGHT_ATTACK.contactShape,
      { x: 1.2, y: 0.82, z: 0 },
      { x: -1, z: 0 },
    )
    const contacts = new CombatContactRuntime()
    expect(
      contacts.resolvePlayerContact({
        combat: startPlayerLightActive(),
        attack: {
          movementConstrained: true,
          executionFacing: { x: -1, z: 0 },
          contactShapeId: away.id,
          activeContactShape: {
            ...PLAYER_LIGHT_ATTACK.contactShape,
            center: away.center,
            facing: { x: -1, z: 0 },
          },
        },
        simulationStep: 12,
        targets: [target.runtime],
        query: fixture.query,
        attackOrigin: { x: 1.2, y: 0.82, z: 0 },
        occlusionQuery: fixture.occlusion,
      }),
    ).toEqual([])
    fixture.free()
  })
})

function startPlayerLightActive() {
  return {
    actionId: PLAYER_LIGHT_ATTACK.action.id,
    phase: 'active' as const,
    executionId: 7,
    elapsedSteps: PLAYER_LIGHT_ATTACK.action.startupSteps,
    phaseElapsedSteps: 0,
    phaseRemainingSteps: PLAYER_LIGHT_ATTACK.action.activeSteps,
    phaseDurationSteps: PLAYER_LIGHT_ATTACK.action.activeSteps,
    totalElapsedSteps: PLAYER_LIGHT_ATTACK.action.startupSteps,
    contact: {
      enabled: true,
      actionId: PLAYER_LIGHT_ATTACK.action.id,
      windowId: PLAYER_LIGHT_ATTACK.contactShape.windowId,
    },
    remainingCooldownSteps: 0,
  }
}

function createTarget(id: string, position: { x: number; y: number; z: number }) {
  const runtime = new TrainingTargetRuntime(
    defineTrainingTarget({
      id,
      position,
      hurtbox: {
        id: `${id}.hurtbox`,
        ownerId: id,
        kind: 'sphere',
        center: position,
        radius: 0.45,
      },
      maximumHealth: 100,
    }),
  )
  return { runtime, hurtbox: runtime.snapshot().hurtbox as SphereHurtbox }
}

function createWallFixture() {
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 })
  // Thin wall on the Z axis at x=0.
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.75, 2).setTranslation(0, 0.75, 0))
  world.step()
  const registrations: Array<{ hurtboxId: string; collider: RAPIER.Collider }> = []
  const query = createRapierCombatContactQuery(world, RAPIER, () => registrations)
  const occlusion = createRapierCombatOcclusionQuery(world, RAPIER)
  return {
    query,
    occlusion,
    register(target: { runtime: TrainingTargetRuntime; hurtbox: SphereHurtbox }) {
      const collider = world.createCollider(
        RAPIER.ColliderDesc.ball(target.hurtbox.radius)
          .setTranslation(target.hurtbox.center.x, target.hurtbox.center.y, target.hurtbox.center.z)
          .setSensor(true),
      )
      registrations.push({ hurtboxId: target.hurtbox.id, collider })
      world.step()
    },
    free() {
      world.free()
    },
  }
}

function createLevelFixture(flags: { shortcutOpen: boolean; finalGateOpen: boolean }) {
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 })
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
  const registrations: Array<{ hurtboxId: string; collider: RAPIER.Collider }> = []
  return {
    query: createRapierCombatContactQuery(world, RAPIER, () => registrations),
    occlusion: createRapierCombatOcclusionQuery(world, RAPIER),
    registerPlayer(player: PlayerHealthRuntime) {
      const hurtbox = player.snapshot().hurtbox
      const collider = world.createCollider(
        RAPIER.ColliderDesc.ball(hurtbox.radius)
          .setTranslation(hurtbox.center.x, hurtbox.center.y, hurtbox.center.z)
          .setSensor(true),
      )
      registrations.push({ hurtboxId: hurtbox.id, collider })
      world.step()
    },
    free() {
      world.free()
    },
  }
}
