import type { CharacterCollisionResolver, PlayerFacingDirection, Vector3Value } from '../character/playerMotor'
import { PLAYER_GRAVITY, PLAYER_MAX_FALL_SPEED } from '../character/playerMotor'
import { defineCombatAction } from '../combat/combatAction'
import type { ActiveCombatContactShape } from '../combat/combatContact'
import { defineEnemy } from './enemyDefinition'
import { EnemyRuntime, type EnemyRuntimeSnapshot } from './enemyRuntime'

export const MELEE_ENEMY_ID = 'enemy.melee.1' as const
export const MELEE_ENEMY_ATTACK_ID = 'enemy.melee.attack' as const
export const MELEE_ENEMY_SPAWN_POSITION = Object.freeze({ x: 2.5, y: 0.82, z: 3 })

export const MELEE_ENEMY_ATTACK = defineCombatAction({
  id: MELEE_ENEMY_ATTACK_ID,
  startupSteps: 30,
  activeSteps: 6,
  recoverySteps: 30,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'never',
  contactWindowId: 'enemy.melee.attack.contact',
  cooldownSteps: 0,
})

export const MELEE_ENEMY_ATTACK_DAMAGE = 15
export const MELEE_ENEMY_CONTACT_SHAPE = Object.freeze({
  id: 'enemy.melee.attack.sphere',
  kind: 'sphere' as const,
  actionId: MELEE_ENEMY_ATTACK_ID,
  windowId: MELEE_ENEMY_ATTACK.contactWindowId!,
  forwardOffset: 0.78,
  radius: 0.52,
})

export const MELEE_ENEMY_DEFINITION = defineEnemy({
  id: 'enemy.melee.graybox',
  role: 'melee',
  tags: ['grounded', 'melee'],
  body: { radius: 0.35, halfHeight: 0.45 },
  hurtbox: {
    id: 'hurtbox',
    kind: 'sphere',
    offset: { x: 0, y: 0, z: 0 },
    radius: 0.46,
  },
  maximumHealth: 100,
  movementSpeed: 2.1,
  perceptionRange: 4.5,
  stoppingRange: 1.32,
  attackRange: 1.32,
  attackActionIds: [MELEE_ENEMY_ATTACK_ID],
})

export interface EnemyAttackSpatialSnapshot {
  readonly executionFacing: PlayerFacingDirection | null
  readonly contactEnabled: boolean
  readonly activeContactShape: ActiveCombatContactShape | null
}

export function createMeleeEnemyRuntime(): EnemyRuntime {
  return new EnemyRuntime(
    MELEE_ENEMY_DEFINITION,
    MELEE_ENEMY_ID,
    MELEE_ENEMY_SPAWN_POSITION,
    [MELEE_ENEMY_ATTACK],
    { x: -1, z: 0 },
  )
}

export function advanceMeleeEnemy(
  runtime: EnemyRuntime,
  playerPosition: Vector3Value,
  fixedStepSeconds: number,
  resolveCollision: CharacterCollisionResolver | null,
): void {
  let enemy = runtime.snapshot()
  if (!enemy.alive) return

  const direction = directionAndDistance(enemy.position, playerPosition)
  if (enemy.state === 'idle') {
    if (direction.distance > runtime.definition.perceptionRange) return
    runtime.transition('pursue', 'player')
    enemy = runtime.snapshot()
  }

  if (enemy.state === 'attack' || enemy.state === 'recovery') {
    runtime.advanceAction()
    return
  }
  if (enemy.state !== 'pursue') return

  if (direction.distance <= runtime.definition.attackRange) {
    runtime.startAction(MELEE_ENEMY_ATTACK_ID, direction.facing ?? enemy.facing)
    return
  }
  if (resolveCollision === null || direction.facing === null) return

  const horizontalSpeed = runtime.definition.movementSpeed
  const verticalVelocity = Math.max(
    enemy.velocity.y - PLAYER_GRAVITY * fixedStepSeconds,
    -PLAYER_MAX_FALL_SPEED,
  )
  const desiredTranslation = {
    x: direction.facing.x * horizontalSpeed * fixedStepSeconds,
    y: verticalVelocity * fixedStepSeconds,
    z: direction.facing.z * horizontalSpeed * fixedStepSeconds,
  }
  const collision = resolveCollision(enemy.position, desiredTranslation)
  runtime.setMotion(
    {
      x: enemy.position.x + collision.translation.x,
      y: enemy.position.y + collision.translation.y,
      z: enemy.position.z + collision.translation.z,
    },
    {
      x: collision.translation.x / fixedStepSeconds,
      y: collision.grounded ? 0 : collision.translation.y / fixedStepSeconds,
      z: collision.translation.z / fixedStepSeconds,
    },
    direction.facing,
  )
}

export function createEnemyAttackSpatialSnapshot(
  enemy: EnemyRuntimeSnapshot,
): EnemyAttackSpatialSnapshot {
  const actionMatches = enemy.action.actionId === MELEE_ENEMY_ATTACK_ID
  const executionFacing = actionMatches ? { ...enemy.facing } : null
  const contactEnabled =
    actionMatches &&
    enemy.alive &&
    enemy.action.contact.enabled &&
    enemy.action.contact.windowId === MELEE_ENEMY_CONTACT_SHAPE.windowId
  return {
    executionFacing,
    contactEnabled,
    activeContactShape:
      contactEnabled && executionFacing !== null
        ? {
            id: MELEE_ENEMY_CONTACT_SHAPE.id,
            kind: 'sphere',
            actionId: MELEE_ENEMY_ATTACK_ID,
            windowId: MELEE_ENEMY_CONTACT_SHAPE.windowId,
            center: {
              x: enemy.position.x + executionFacing.x * MELEE_ENEMY_CONTACT_SHAPE.forwardOffset,
              y: enemy.position.y,
              z: enemy.position.z + executionFacing.z * MELEE_ENEMY_CONTACT_SHAPE.forwardOffset,
            },
            radius: MELEE_ENEMY_CONTACT_SHAPE.radius,
          }
        : null,
  }
}

export function horizontalDistance(from: Vector3Value, to: Vector3Value): number {
  return Math.hypot(to.x - from.x, to.z - from.z)
}

function directionAndDistance(
  from: Vector3Value,
  to: Vector3Value,
): { readonly distance: number; readonly facing: PlayerFacingDirection | null } {
  const deltaX = to.x - from.x
  const deltaZ = to.z - from.z
  const distance = Math.hypot(deltaX, deltaZ)
  return {
    distance,
    facing:
      distance === 0 ? null : { x: deltaX / distance, z: deltaZ / distance },
  }
}
