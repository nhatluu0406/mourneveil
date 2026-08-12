import type {
  PlayerAttackKind,
  PlayerAttackRequest,
} from '../../input/playerAttackIntent'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { PlayerFacingDirection, Vector3Value } from '../character/playerMotor'
import {
  defineCombatAction,
  type CombatActionDefinition,
  type CombatActionId,
  type CombatContactWindowId,
} from './combatAction'
import type { CombatActionSnapshot } from './combatActionRuntime'
import { getSkillDefinition } from '../skills/skillDefinition'

export const PLAYER_LIGHT_ATTACK_ID = 'player.attack.light' as const
export const PLAYER_HEAVY_ATTACK_ID = 'player.attack.heavy' as const

export interface PlayerAttackContactShapeDefinition {
  readonly id: string
  readonly kind: 'sphere'
  readonly actionId: CombatActionId
  readonly windowId: CombatContactWindowId
  readonly forwardOffset: number
  readonly radius: number
}

export interface PlayerAttackDefinition {
  readonly kind: PlayerAttackKind
  readonly action: CombatActionDefinition
  readonly contactShape: PlayerAttackContactShapeDefinition
  readonly damage: number
}

export interface ActivePlayerAttackContactShape
  extends PlayerAttackContactShapeDefinition {
  readonly center: Vector3Value
  readonly facing: PlayerFacingDirection
}

export interface PlayerAttackSpatialSnapshot {
  readonly movementConstrained: boolean
  readonly executionFacing: PlayerFacingDirection | null
  readonly contactShapeId: string | null
  readonly activeContactShape: ActivePlayerAttackContactShape | null
}

function definePlayerAttack(
  definition: PlayerAttackDefinition,
): PlayerAttackDefinition {
  const action = defineCombatAction(definition.action)
  const shape = definition.contactShape
  if (shape.actionId !== action.id || shape.windowId !== action.contactWindowId) {
    throw new Error('Player attack contact shape must match its action and window')
  }
  if (
    shape.kind !== 'sphere' ||
    !Number.isFinite(shape.forwardOffset) ||
    shape.forwardOffset <= 0 ||
    !Number.isFinite(shape.radius) ||
    shape.radius <= 0
  ) {
    throw new RangeError('Player attack contact shape dimensions must be positive')
  }
  if (!Number.isFinite(definition.damage) || definition.damage <= 0) {
    throw new RangeError('Player attack damage must be a finite positive number')
  }

  return Object.freeze({
    kind: definition.kind,
    action,
    contactShape: Object.freeze({ ...shape }),
    damage: definition.damage,
  })
}

export const PLAYER_LIGHT_ATTACK = definePlayerAttack({
  kind: 'light',
  action: {
    id: PLAYER_LIGHT_ATTACK_ID,
    startupSteps: 10,
    activeSteps: 5,
    recoverySteps: 16,
    resourceCost: null,
    cancellationPolicy: 'recovery-only',
    interruptibilityPolicy: 'always',
    contactWindowId: 'player.attack.light.contact',
    cooldownSteps: 0,
  },
  contactShape: {
    id: 'player.attack.light.sphere',
    kind: 'sphere',
    actionId: PLAYER_LIGHT_ATTACK_ID,
    windowId: 'player.attack.light.contact',
    forwardOffset: 0.82,
    radius: 0.52,
  },
  damage: 20,
})

export const PLAYER_HEAVY_ATTACK = definePlayerAttack({
  kind: 'heavy',
  action: {
    id: PLAYER_HEAVY_ATTACK_ID,
    // Startup must stay ≤ skirmisher startup (20) so simultaneous wind-ups remain interruptible.
    startupSteps: 18,
    activeSteps: 8,
    recoverySteps: 38,
    resourceCost: null,
    cancellationPolicy: 'recovery-only',
    interruptibilityPolicy: 'always',
    contactWindowId: 'player.attack.heavy.contact',
    cooldownSteps: 0,
  },
  contactShape: {
    id: 'player.attack.heavy.sphere',
    kind: 'sphere',
    actionId: PLAYER_HEAVY_ATTACK_ID,
    windowId: 'player.attack.heavy.contact',
    forwardOffset: 0.98,
    radius: 0.68,
  },
  damage: 35,
})

export const PLAYER_ATTACK_DEFINITIONS = Object.freeze([
  PLAYER_LIGHT_ATTACK,
  PLAYER_HEAVY_ATTACK,
])

export function playerAttackForRequest(
  request: PlayerAttackRequest,
): PlayerAttackDefinition {
  return request.attack === 'light' ? PLAYER_LIGHT_ATTACK : PLAYER_HEAVY_ATTACK
}

export function playerAttackForActionId(
  actionId: CombatActionId | null,
): PlayerAttackDefinition | null {
  return (
    PLAYER_ATTACK_DEFINITIONS.find(
      (definition) => definition.action.id === actionId,
    ) ?? null
  )
}

export function transformPlayerAttackContactShape(
  definition: PlayerAttackContactShapeDefinition,
  playerPosition: Vector3Value,
  facing: PlayerFacingDirection,
): ActivePlayerAttackContactShape {
  return {
    ...definition,
    center: {
      x: playerPosition.x + facing.x * definition.forwardOffset,
      y: playerPosition.y,
      z: playerPosition.z + facing.z * definition.forwardOffset,
    },
    facing: { ...facing },
  }
}

/** True when the authoritative contact sphere can reach a sphere hurtbox. */
export function attackContactOverlapsSphere(
  contact: Pick<ActivePlayerAttackContactShape, 'center' | 'radius'>,
  hurtbox: { readonly center: Vector3Value; readonly radius: number },
): boolean {
  const dx = contact.center.x - hurtbox.center.x
  const dy = contact.center.y - hurtbox.center.y
  const dz = contact.center.z - hurtbox.center.z
  const limit = contact.radius + hurtbox.radius
  return dx * dx + dy * dy + dz * dz <= limit * limit
}

/** Recovery returns partial control; startup/active stay fully committed. */
export const PLAYER_ATTACK_RECOVERY_MOVEMENT_SCALE = 0.35

export function constrainMovementIntentForAttack(
  movementIntent: PlayerMovementIntent,
  combatPhase: CombatActionSnapshot['phase'],
): PlayerMovementIntent {
  if (combatPhase === 'idle') return movementIntent
  if (combatPhase === 'recovery') {
    return {
      horizontal: movementIntent.horizontal * PLAYER_ATTACK_RECOVERY_MOVEMENT_SCALE,
      forward: movementIntent.forward * PLAYER_ATTACK_RECOVERY_MOVEMENT_SCALE,
    }
  }
  return { horizontal: 0, forward: 0 }
}

/**
 * Builds attack spatial data from an explicit execution-facing snapshot.
 * Callers must pass the frozen accepted aim while an attack is committed —
 * never live movement facing, mouse aim, or rendered rotation.
 */
export function createPlayerAttackSpatialSnapshot(
  combat: CombatActionSnapshot,
  playerPosition: Vector3Value,
  executionFacing: PlayerFacingDirection | null,
): PlayerAttackSpatialSnapshot {
  const attack = playerAttackForActionId(combat.actionId)
  const skill = combat.actionId === null ? null : getSkillDefinition(combat.actionId)
  const skillContact =
    skill?.effect.kind === 'empowered-melee' ? skill.effect.contactShape : null
  const contactDefinition = attack?.contactShape ?? skillContact
  const movementConstrained = combat.phase !== 'idle'
  if (contactDefinition === null || executionFacing === null) {
    return {
      movementConstrained,
      executionFacing: null,
      contactShapeId: null,
      activeContactShape: null,
    }
  }

  const facing = { ...executionFacing }
  const contactIsActive =
    combat.contact.enabled &&
    combat.contact.windowId === contactDefinition.windowId
  return {
    movementConstrained,
    executionFacing: facing,
    contactShapeId: contactDefinition.id,
    activeContactShape: contactIsActive
      ? transformPlayerAttackContactShape(
          contactDefinition,
          playerPosition,
          facing,
        )
      : null,
  }
}
