import type { PlayerDodgeRequest } from '../../input/playerDefenseIntent'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import { movementIntentToFacing, type PlayerFacingDirection } from '../character/playerMotor'
import { defineCombatAction, type CombatActionDefinition } from './combatAction'
import type { CombatActionSnapshot, CombatActionStartResult } from './combatActionRuntime'

export const PLAYER_DODGE_ACTION_ID = 'player.dodge' as const
export const PLAYER_DODGE_SPEED = 8
export const PLAYER_GUARD_MOVEMENT_SCALE = 0.35
export const PLAYER_GUARD_CONE_ANGLE_DEGREES = 120
export const PLAYER_GUARD_IMPACT_THRESHOLD = 3
export const PLAYER_GUARD_BREAK_DURATION_STEPS = 72
export const PLAYER_GUARD_IMPACT_RESET_DELAY_STEPS = 180
const PLAYER_GUARD_CONE_MINIMUM_DOT = Math.cos(
  (PLAYER_GUARD_CONE_ANGLE_DEGREES * Math.PI) / 360,
)

export type IncomingMeleeDefenseOutcome =
  | 'damaged'
  | 'dodged'
  | 'guarded'
  | 'guard-broken'

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
  readonly guardImpact: number
  readonly guardImpactThreshold: number
  readonly guardBroken: boolean
  readonly guardBreakRemainingSteps: number
}

export class PlayerDefenseRuntime {
  private guardIntentHeld = false
  private guarding = false
  private dodgeExecution: {
    readonly executionId: number
    readonly direction: PlayerFacingDirection
  } | null = null
  private guardImpact = 0
  private guardImpactResetDelaySteps = 0
  private guardBreakRemainingSteps = 0

  setGuardIntent(held: boolean): void {
    this.guardIntentHeld = this.guardBreakRemainingSteps === 0 && held
  }

  reset(): void {
    this.guardIntentHeld = false
    this.guarding = false
    this.dodgeExecution = null
    this.guardImpact = 0
    this.guardImpactResetDelaySteps = 0
    this.guardBreakRemainingSteps = 0
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
    if (this.guardBreakRemainingSteps > 0) {
      this.guardBreakRemainingSteps -= 1
      this.guardIntentHeld = false
      this.guarding = false
      if (this.guardBreakRemainingSteps === 0) this.guardImpact = 0
    } else if (this.guardImpactResetDelaySteps > 0) {
      this.guardImpactResetDelaySteps -= 1
      if (this.guardImpactResetDelaySteps === 0) this.guardImpact = 0
    }
    if (
      this.dodgeExecution !== null &&
      (combat.actionId !== PLAYER_DODGE_ACTION_ID ||
        combat.executionId !== this.dodgeExecution.executionId)
    ) {
      this.dodgeExecution = null
    }
    this.guarding =
      this.guardBreakRemainingSteps === 0 &&
      combat.phase === 'idle' &&
      this.guardIntentHeld
  }

  resolveIncomingMelee(
    combat: CombatActionSnapshot,
    playerFacing: PlayerFacingDirection,
    attackFacing: PlayerFacingDirection,
    impact: number,
  ): IncomingMeleeDefenseOutcome {
    const outcome = resolveIncomingMeleeDefense(
      this.snapshot(combat),
      playerFacing,
      attackFacing,
    )
    if (outcome !== 'guarded') return outcome

    this.guardImpact = Math.min(
      PLAYER_GUARD_IMPACT_THRESHOLD,
      this.guardImpact + Math.max(0, impact),
    )
    this.guardImpactResetDelaySteps = PLAYER_GUARD_IMPACT_RESET_DELAY_STEPS
    if (this.guardImpact < PLAYER_GUARD_IMPACT_THRESHOLD) return 'guarded'

    this.guardIntentHeld = false
    this.guarding = false
    this.guardImpactResetDelaySteps = 0
    this.guardBreakRemainingSteps = PLAYER_GUARD_BREAK_DURATION_STEPS
    return 'guard-broken'
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
      guardImpact: this.guardImpact,
      guardImpactThreshold: PLAYER_GUARD_IMPACT_THRESHOLD,
      guardBroken: this.guardBreakRemainingSteps > 0,
      guardBreakRemainingSteps: this.guardBreakRemainingSteps,
    }
  }
}

export function resolveIncomingMeleeDefense(
  defense: PlayerDefenseSnapshot,
  playerFacing: PlayerFacingDirection,
  attackFacing: PlayerFacingDirection,
): IncomingMeleeDefenseOutcome {
  if (defense.invulnerable) return 'dodged'
  if (!defense.guarding) return 'damaged'

  const incomingX = -attackFacing.x
  const incomingZ = -attackFacing.z
  const dot = playerFacing.x * incomingX + playerFacing.z * incomingZ
  return dot >= PLAYER_GUARD_CONE_MINIMUM_DOT ? 'guarded' : 'damaged'
}
