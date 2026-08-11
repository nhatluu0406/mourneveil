import type { CharacterCollisionResolver, PlayerFacingDirection, Vector3Value } from '../character/playerMotor'
import { PLAYER_GRAVITY, PLAYER_MAX_FALL_SPEED } from '../character/playerMotor'
import type { ActiveCombatContactShape } from '../combat/combatContact'
import { EnemyRuntime, type EnemyRuntimeSnapshot } from './enemyRuntime'
import {
  createEnemyRuntimeFromRole,
  meleeRoleByActionId,
  meleeRoleByDefinitionId,
  SKIRMISHER_ROLE,
  type EnemyMeleeRoleSpec,
} from './enemyRoles'

/** @deprecated Prefer SKIRMISHER_ROLE; retained as the converted M3 melee baseline. */
export const MELEE_ENEMY_ID = SKIRMISHER_ROLE.runtimeId
export const MELEE_ENEMY_ATTACK_ID = SKIRMISHER_ROLE.attack.id
export const MELEE_ENEMY_SPAWN_POSITION = SKIRMISHER_ROLE.spawnPosition
export const MELEE_ENEMY_ATTACK = SKIRMISHER_ROLE.attack
export const MELEE_ENEMY_ATTACK_DAMAGE = SKIRMISHER_ROLE.damage
export const MELEE_ENEMY_CONTACT_SHAPE = SKIRMISHER_ROLE.contact
export const MELEE_ENEMY_DEFINITION = SKIRMISHER_ROLE.definition

export interface EnemyAttackSpatialSnapshot {
  readonly executionFacing: PlayerFacingDirection | null
  readonly contactEnabled: boolean
  readonly activeContactShape: ActiveCombatContactShape | null
}

export function createMeleeEnemyRuntime(): EnemyRuntime {
  return createEnemyRuntimeFromRole(SKIRMISHER_ROLE)
}

export function advanceMeleeEnemy(
  runtime: EnemyRuntime,
  playerPosition: Vector3Value,
  fixedStepSeconds: number,
  resolveCollision: CharacterCollisionResolver | null,
  options: {
    readonly targetAlive?: boolean
    /** When set, pursue this authored route waypoint instead of the player. */
    readonly navigationTarget?: Vector3Value | null
    /** Called when direct pursuit toward the player is locally blocked. */
    readonly onDirectPursuitBlocked?: () => void
  } = {},
): void {
  let enemy = runtime.snapshot()
  if (!enemy.alive) return

  const attackId = runtime.definition.attackActionIds[0]
  const targetAlive = options.targetAlive ?? true
  if (!targetAlive) {
    // Keep committed action clocks advancing so recovery cannot freeze, then
    // release the dead target into idle (no permanent non-terminal dead-end).
    if (enemy.state === 'attack' || enemy.state === 'recovery') {
      runtime.advanceAction()
      enemy = runtime.snapshot()
    }
    if (enemy.state === 'pursue' || enemy.state === 'spacing') {
      runtime.transition('idle')
    }
    return
  }

  const playerDirection = directionAndDistance(enemy.position, playerPosition)
  const navigationTarget = options.navigationTarget ?? null
  const pursuitTarget =
    navigationTarget !== null && enemy.state === 'pursue'
      ? navigationTarget
      : playerPosition
  const direction = directionAndDistance(enemy.position, pursuitTarget)

  if (enemy.state === 'idle') {
    if (playerDirection.distance > runtime.definition.perceptionRange) return
    runtime.transition('pursue', 'player')
    enemy = runtime.snapshot()
  }

  if (enemy.state === 'attack' || enemy.state === 'recovery') {
    runtime.advanceAction()
    return
  }
  if (enemy.state === 'spacing') {
    if (playerDirection.distance > runtime.definition.attackRange) {
      runtime.transition('pursue')
      enemy = runtime.snapshot()
    } else {
      runtime.holdSpacing(playerDirection.facing)
      if (playerDirection.distance <= runtime.definition.stoppingRange) {
        runtime.startAction(attackId, playerDirection.facing ?? enemy.facing)
      }
      return
    }
  }
  if (enemy.state !== 'pursue') return

  if (
    navigationTarget === null &&
    playerDirection.distance <= runtime.definition.stoppingRange
  ) {
    runtime.startAction(attackId, playerDirection.facing ?? enemy.facing)
    return
  }
  if (resolveCollision === null || direction.facing === null) {
    if (playerDirection.distance <= runtime.definition.attackRange) {
      runtime.transition('spacing')
      runtime.holdSpacing(playerDirection.facing ?? enemy.facing)
      if (playerDirection.distance <= runtime.definition.stoppingRange) {
        runtime.startAction(attackId, playerDirection.facing ?? enemy.facing)
      }
    }
    return
  }

  const horizontalSpeed = runtime.definition.movementSpeed
  const verticalVelocity = Math.max(
    enemy.velocity.y - PLAYER_GRAVITY * fixedStepSeconds,
    -PLAYER_MAX_FALL_SPEED,
  )
  const maximumTravel = horizontalSpeed * fixedStepSeconds
  const remaining =
    navigationTarget === null
      ? Math.max(0, direction.distance - runtime.definition.stoppingRange)
      : direction.distance
  const horizontalTravel = Math.min(maximumTravel, remaining)
  const desiredTranslation = {
    x: direction.facing.x * horizontalTravel,
    y: verticalVelocity * fixedStepSeconds,
    z: direction.facing.z * horizontalTravel,
  }
  const collision = resolvePursuitCollision(
    runtime.id,
    enemy.position,
    desiredTranslation,
    direction.facing,
    resolveCollision,
  )
  const movedHorizontal = Math.hypot(collision.translation.x, collision.translation.z)
  if (desiredTranslation.x !== 0 || desiredTranslation.z !== 0) {
    if (movedHorizontal < maximumTravel * 0.05) {
      if (
        navigationTarget === null &&
        playerDirection.distance <= runtime.definition.attackRange
      ) {
        runtime.transition('spacing')
        runtime.holdSpacing(playerDirection.facing)
        if (playerDirection.distance <= runtime.definition.stoppingRange) {
          runtime.startAction(attackId, playerDirection.facing ?? enemy.facing)
        }
        return
      }
      options.onDirectPursuitBlocked?.()
    }
  }
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
    navigationTarget === null
      ? (playerDirection.facing ?? direction.facing)
      : direction.facing,
  )
}

export function createEnemyAttackSpatialSnapshot(
  enemy: EnemyRuntimeSnapshot,
): EnemyAttackSpatialSnapshot {
  const role = resolveRoleForEnemy(enemy)
  if (role === null) {
    return { executionFacing: null, contactEnabled: false, activeContactShape: null }
  }
  const actionMatches = enemy.action.actionId === role.attack.id
  const executionFacing = actionMatches && enemy.attackExecutionFacing !== null
    ? { ...enemy.attackExecutionFacing }
    : null
  const contactEnabled =
    actionMatches &&
    enemy.alive &&
    enemy.action.contact.enabled &&
    enemy.action.contact.windowId === role.contact.windowId
  return {
    executionFacing,
    contactEnabled,
    activeContactShape:
      contactEnabled && executionFacing !== null
        ? {
            id: role.contact.id,
            kind: 'sphere',
            actionId: role.attack.id,
            windowId: role.contact.windowId,
            center: {
              x: enemy.position.x + executionFacing.x * role.contact.forwardOffset,
              y: enemy.position.y,
              z: enemy.position.z + executionFacing.z * role.contact.forwardOffset,
            },
            radius: role.contact.radius,
          }
        : null,
  }
}

export function enemyAttackDamage(enemy: EnemyRuntimeSnapshot): number {
  return resolveRoleForEnemy(enemy)?.damage ?? 0
}

export function enemyAttackGuardImpact(enemy: EnemyRuntimeSnapshot): number {
  return resolveRoleForEnemy(enemy)?.guardImpact ?? 0
}

export function horizontalDistance(a: Vector3Value, b: Vector3Value): number {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

function resolveRoleForEnemy(enemy: EnemyRuntimeSnapshot): EnemyMeleeRoleSpec | null {
  return (
    meleeRoleByActionId(enemy.action.actionId) ??
    meleeRoleByDefinitionId(enemy.definitionId)
  )
}

function resolvePursuitCollision(
  runtimeId: string,
  position: Vector3Value,
  desiredTranslation: Vector3Value,
  pursuitFacing: PlayerFacingDirection,
  resolveCollision: CharacterCollisionResolver,
) {
  const direct = resolveCollision(position, desiredTranslation)
  const desiredHorizontalDistance = Math.hypot(
    desiredTranslation.x,
    desiredTranslation.z,
  )
  const directHorizontalDistance = Math.hypot(
    direct.translation.x,
    direct.translation.z,
  )
  if (
    desiredHorizontalDistance <= 0 ||
    directHorizontalDistance >= desiredHorizontalDistance * 0.6
  ) return direct

  const preferredSign = stableSteeringSign(runtimeId)
  const candidates = [preferredSign, -preferredSign].map((sign) => {
    const steeredFacing = normalizeHorizontal({
      x: pursuitFacing.x - pursuitFacing.z * sign,
      z: pursuitFacing.z + pursuitFacing.x * sign,
    })
    const steeredTranslation = {
      x: steeredFacing.x * desiredHorizontalDistance,
      y: desiredTranslation.y,
      z: steeredFacing.z * desiredHorizontalDistance,
    }
    const collision = resolveCollision(position, steeredTranslation)
    const forwardProgress =
      collision.translation.x * pursuitFacing.x +
      collision.translation.z * pursuitFacing.z
    const steeredHorizontalDistance = Math.hypot(
      collision.translation.x,
      collision.translation.z,
    )
    return {
      score: steeredHorizontalDistance + Math.max(0, forwardProgress),
      translation: steeredTranslation,
    }
  })
  const best = candidates[0].score >= candidates[1].score ? candidates[0] : candidates[1]
  return resolveCollision(
    position,
    best.score > directHorizontalDistance ? best.translation : desiredTranslation,
  )
}

function stableSteeringSign(runtimeId: string): 1 | -1 {
  let hash = 0
  for (let index = 0; index < runtimeId.length; index += 1) {
    hash = (hash * 31 + runtimeId.charCodeAt(index)) | 0
  }
  return (hash & 1) === 0 ? 1 : -1
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

function normalizeHorizontal(value: PlayerFacingDirection): PlayerFacingDirection {
  const magnitude = Math.hypot(value.x, value.z)
  return { x: value.x / magnitude, z: value.z / magnitude }
}
