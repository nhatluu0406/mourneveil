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
  stoppingRange: 1.28,
  attackRange: 1.48,
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
  options: { readonly targetAlive?: boolean } = {},
): void {
  let enemy = runtime.snapshot()
  if (!enemy.alive) return

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
  if (enemy.state === 'spacing') {
    if (direction.distance > runtime.definition.attackRange) {
      runtime.transition('pursue')
      enemy = runtime.snapshot()
    } else {
      runtime.holdSpacing(direction.facing)
      if (direction.distance <= runtime.definition.stoppingRange) {
        runtime.startAction(MELEE_ENEMY_ATTACK_ID, direction.facing ?? enemy.facing)
      }
      return
    }
  }
  if (enemy.state !== 'pursue') return

  if (direction.distance <= runtime.definition.stoppingRange) {
    runtime.startAction(MELEE_ENEMY_ATTACK_ID, direction.facing ?? enemy.facing)
    return
  }
  if (resolveCollision === null || direction.facing === null) {
    // Without a valid pursuit step, still allow committed melee when already
    // inside the resume/attack band so pursue cannot soft-lock.
    if (direction.distance <= runtime.definition.attackRange) {
      runtime.transition('spacing')
      runtime.holdSpacing(direction.facing ?? enemy.facing)
      if (direction.distance <= runtime.definition.stoppingRange) {
        runtime.startAction(MELEE_ENEMY_ATTACK_ID, direction.facing ?? enemy.facing)
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
  const horizontalTravel = Math.min(
    maximumTravel,
    direction.distance - runtime.definition.stoppingRange,
  )
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
  if (
    desiredTranslation.x !== 0 ||
    desiredTranslation.z !== 0
  ) {
    if (
      movedHorizontal < maximumTravel * 0.05 &&
      direction.distance <= runtime.definition.attackRange
    ) {
      // Collision soft-lock: enter spacing so the enemy can re-evaluate attack
      // instead of remaining forever in pursue with a zero step.
      runtime.transition('spacing')
      runtime.holdSpacing(direction.facing)
      if (direction.distance <= runtime.definition.stoppingRange) {
        runtime.startAction(MELEE_ENEMY_ATTACK_ID, direction.facing)
      }
      return
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
    direction.facing,
  )
}

export function createEnemyAttackSpatialSnapshot(
  enemy: EnemyRuntimeSnapshot,
): EnemyAttackSpatialSnapshot {
  const actionMatches = enemy.action.actionId === MELEE_ENEMY_ATTACK_ID
  const executionFacing = actionMatches && enemy.attackExecutionFacing !== null
    ? { ...enemy.attackExecutionFacing }
    : null
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
    const horizontalDistance = Math.hypot(
      collision.translation.x,
      collision.translation.z,
    )
    return {
      score: horizontalDistance + Math.max(0, forwardProgress),
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

function normalizeHorizontal(value: PlayerFacingDirection): PlayerFacingDirection {
  const magnitude = Math.hypot(value.x, value.z)
  return { x: value.x / magnitude, z: value.z / magnitude }
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
