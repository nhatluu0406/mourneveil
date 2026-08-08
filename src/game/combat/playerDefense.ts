import type { PlayerDodgeRequest } from '../../input/playerDefenseIntent'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import { movementIntentToFacing, type PlayerFacingDirection } from '../character/playerMotor'
import { defineCombatAction, type CombatActionDefinition } from './combatAction'
import type { CombatActionSnapshot, CombatActionStartResult } from './combatActionRuntime'

export const PLAYER_DODGE_ACTION_ID = 'player.dodge' as const
export const PLAYER_DODGE_SPEED = 8
export const PLAYER_GUARD_MOVEMENT_SCALE = 0.35

export const PLAYER_DODGE_ACTION: CombatActionDefinition = defineCombatAction({
  id: PLAYER_DODGE_ACTION_ID,
  startupSteps: 2,
  activeSteps: 8,
  recoverySteps: 8,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'always',
  contactWindowId: null,
  cooldownSteps: 0,
})

export interface PlayerDefenseSnapshot {
  readonly guarding: boolean
  readonly guardIntentHeld: boolean
  readonly movementScale: number
  readonly dodgeExecutionId: number | null
  readonly dodgeDirection: PlayerFacingDirection | null
  readonly dodgeMovementActive: boolean
  readonly invulnerable: boolean
}

export class PlayerDefenseRuntime {
  private guardIntentHeld = false
  private guarding = false
  private dodgeExecution: {
    readonly executionId: number
    readonly direction: PlayerFacingDirection
  } | null = null

  setGuardIntent(held: boolean): void {
    this.guardIntentHeld = held
  }

  canStartAction(): boolean {
    return !this.guarding && !this.guardIntentHeld
  }

  sampleDodgeDirection(
    _request: PlayerDodgeRequest,
    movementIntent: PlayerMovementIntent,
    fallbackFacing: PlayerFacingDirection,
  ): PlayerFacingDirection {
    return movementIntent.horizontal === 0 && movementIntent.forward === 0
      ? { ...fallbackFacing }
      : movementIntentToFacing(movementIntent)
  }

  acceptDodge(
    result: CombatActionStartResult,
    direction: PlayerFacingDirection,
  ): void {
    if (!result.accepted || result.actionId !== PLAYER_DODGE_ACTION_ID) return
    this.dodgeExecution = {
      executionId: result.executionId,
      direction: { ...direction },
    }
    this.guarding = false
  }

  advanceFixedStep(combat: CombatActionSnapshot): void {
    if (
      this.dodgeExecution !== null &&
      (combat.actionId !== PLAYER_DODGE_ACTION_ID ||
        combat.executionId !== this.dodgeExecution.executionId)
    ) {
      this.dodgeExecution = null
    }
    this.guarding = combat.phase === 'idle' && this.guardIntentHeld
  }

  snapshot(combat: CombatActionSnapshot): PlayerDefenseSnapshot {
    const dodgeExecution = this.dodgeExecution
    const activeDodge =
      dodgeExecution !== null &&
      combat.actionId === PLAYER_DODGE_ACTION_ID &&
      combat.executionId === dodgeExecution.executionId
        ? dodgeExecution
        : null
    return {
      guarding: this.guarding,
      guardIntentHeld: this.guardIntentHeld,
      movementScale: this.guarding ? PLAYER_GUARD_MOVEMENT_SCALE : 1,
      dodgeExecutionId: activeDodge?.executionId ?? null,
      dodgeDirection: activeDodge === null ? null : { ...activeDodge.direction },
      dodgeMovementActive: activeDodge !== null && combat.phase === 'active',
      invulnerable: activeDodge !== null && combat.phase === 'active',
    }
  }
}
