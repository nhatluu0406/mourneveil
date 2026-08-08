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
    startupSteps: 8,
    activeSteps: 4,
    recoverySteps: 14,
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
    startupSteps: 18,
    activeSteps: 6,
    recoverySteps: 30,
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

export function constrainMovementIntentForAttack(
  movementIntent: PlayerMovementIntent,
  combatPhase: CombatActionSnapshot['phase'],
): PlayerMovementIntent {
  return combatPhase === 'idle'
    ? movementIntent
    : { horizontal: 0, forward: 0 }
}

export function createPlayerAttackSpatialSnapshot(
  combat: CombatActionSnapshot,
  playerPosition: Vector3Value,
  facing: PlayerFacingDirection,
): PlayerAttackSpatialSnapshot {
  const attack = playerAttackForActionId(combat.actionId)
  const movementConstrained = combat.phase !== 'idle'
  if (attack === null) {
    return {
      movementConstrained,
      executionFacing: null,
      contactShapeId: null,
      activeContactShape: null,
    }
  }

  const contactIsActive =
    combat.contact.enabled &&
    combat.contact.windowId === attack.contactShape.windowId
  return {
    movementConstrained,
    executionFacing: { ...facing },
    contactShapeId: attack.contactShape.id,
    activeContactShape: contactIsActive
      ? transformPlayerAttackContactShape(
          attack.contactShape,
          playerPosition,
          facing,
        )
      : null,
  }
}
