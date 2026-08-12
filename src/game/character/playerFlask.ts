import { defineCombatAction, type CombatActionDefinition } from '../combat/combatAction'
import type {
  CombatActionSnapshot,
  CombatActionStartResult,
} from '../combat/combatActionRuntime'
import type { CombatHealthState } from '../combat/combatHealth'

export const PLAYER_FLASK_ACTION_ID = 'player.use-flask' as const
export const PLAYER_FLASK_RESOURCE_ID = 'player.flask-charge' as const

export interface PlayerFlaskDefinition {
  readonly maximumCharges: number
  readonly healAmount: number
  readonly action: CombatActionDefinition
}

export const PLAYER_FLASK_DEFINITION: PlayerFlaskDefinition = Object.freeze({
  maximumCharges: 3,
  healAmount: 40,
  action: defineCombatAction({
    id: PLAYER_FLASK_ACTION_ID,
    startupSteps: 12,
    activeSteps: 1,
    recoverySteps: 18,
    resourceCost: Object.freeze({ resourceId: PLAYER_FLASK_RESOURCE_ID, amount: 1 }),
    cancellationPolicy: 'never',
    interruptibilityPolicy: 'always',
    contactWindowId: null,
    cooldownSteps: 0,
  }),
})

export interface PlayerFlaskSnapshot {
  readonly maximumCharges: number
  readonly currentCharges: number
  readonly healAmount: number
  readonly pendingExecutionId: number | null
  readonly lastRestoredHealth: number
}

export class PlayerFlaskRuntime {
  private currentCharges = PLAYER_FLASK_DEFINITION.maximumCharges
  private pendingExecutionId: number | null = null
  private appliedExecutionId: number | null = null
  private lastRestoredHealth = 0
  private healBonus = 0

  validateUse(health: CombatHealthState): { readonly allowed: true } | {
    readonly allowed: false
    readonly reason: 'no-charges' | 'full-health' | 'actor-dead'
  } {
    if (!health.alive) return { allowed: false, reason: 'actor-dead' }
    if (this.currentCharges <= 0) return { allowed: false, reason: 'no-charges' }
    if (health.current >= health.maximum) return { allowed: false, reason: 'full-health' }
    return { allowed: true }
  }

  acceptUse(result: CombatActionStartResult): void {
    if (!result.accepted || result.actionId !== PLAYER_FLASK_ACTION_ID) return
    this.pendingExecutionId = result.executionId
    this.appliedExecutionId = null
    this.lastRestoredHealth = 0
  }

  advanceFixedStep(combat: CombatActionSnapshot): number | null {
    if (
      this.pendingExecutionId === null ||
      combat.actionId !== PLAYER_FLASK_ACTION_ID ||
      combat.executionId !== this.pendingExecutionId
    ) {
      if (combat.phase === 'idle') this.cancelCommittedUse()
      return null
    }
    if (combat.phase !== 'active' || this.appliedExecutionId === combat.executionId) {
      return null
    }

    this.currentCharges -= 1
    this.appliedExecutionId = combat.executionId
    return Math.max(0, PLAYER_FLASK_DEFINITION.healAmount + this.healBonus)
  }

  recordRestoration(restoredHealth: number): void {
    this.lastRestoredHealth = restoredHealth
  }

  /** Equipment composition hook; does not persist. */
  setHealBonus(bonus: number): void {
    if (!Number.isInteger(bonus)) {
      throw new RangeError('Flask heal bonus must be an integer')
    }
    this.healBonus = bonus
  }

  refill(): void {
    this.currentCharges = PLAYER_FLASK_DEFINITION.maximumCharges
  }

  setCharges(charges: number): void {
    if (!Number.isInteger(charges) || charges < 0) {
      throw new RangeError('Flask charges must be a non-negative integer')
    }
    this.currentCharges = Math.min(charges, PLAYER_FLASK_DEFINITION.maximumCharges)
  }

  cancelCommittedUse(): void {
    this.pendingExecutionId = null
    this.appliedExecutionId = null
  }

  snapshot(): PlayerFlaskSnapshot {
    return {
      maximumCharges: PLAYER_FLASK_DEFINITION.maximumCharges,
      currentCharges: this.currentCharges,
      healAmount: Math.max(0, PLAYER_FLASK_DEFINITION.healAmount + this.healBonus),
      pendingExecutionId: this.pendingExecutionId,
      lastRestoredHealth: this.lastRestoredHealth,
    }
  }
}
