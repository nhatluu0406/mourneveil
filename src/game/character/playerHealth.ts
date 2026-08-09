import {
  applyCombatDamage,
  createCombatHealth,
  restoreCombatHealth,
  type CombatDamageResult,
  type CombatHealthRestoreResult,
  type CombatHealthState,
} from '../combat/combatHealth'
import type { CombatTargetSnapshot, SphereHurtbox } from '../combat/combatTarget'
import type { Vector3Value } from './playerMotor'

export const PLAYER_ID = 'player' as const
export const PLAYER_MAXIMUM_HEALTH = 100
export const PLAYER_HURTBOX_ID = 'player.hurtbox' as const
export const PLAYER_HURTBOX_RADIUS = 0.42

export interface PlayerHealthSnapshot extends CombatTargetSnapshot {
  readonly id: typeof PLAYER_ID
  readonly hurtbox: SphereHurtbox
  readonly health: CombatHealthState
  readonly lifeState: 'alive' | 'dead'
  readonly baseMaximumHealth: number
  readonly maximumHealthBonus: number
}

export class PlayerHealthRuntime {
  private readonly baseMaximumHealth = PLAYER_MAXIMUM_HEALTH
  private maximumHealthBonus = 0
  private health = createCombatHealth(PLAYER_MAXIMUM_HEALTH)
  private position: Vector3Value

  constructor(position: Vector3Value) {
    this.position = { ...position }
  }

  updatePosition(position: Vector3Value): void {
    this.position = { ...position }
  }

  applyDamage(damage: number): CombatDamageResult {
    const result = applyCombatDamage(this.health, damage)
    if (result.applied) this.health = result.health
    return result
  }

  restore(amount: number): CombatHealthRestoreResult {
    const result = restoreCombatHealth(this.health, amount)
    if (result.applied) this.health = result.health
    return result
  }

  restoreToMaximum(): void {
    this.health = createCombatHealth(this.resolvedMaximumHealth())
  }

  /**
   * Charm/equipment max-health bonus. Current health clamps into the new maximum;
   * dead actors stay dead until an explicit restore/respawn.
   */
  setMaximumHealthBonus(bonus: number): void {
    if (!Number.isInteger(bonus) || bonus < 0) {
      throw new RangeError('Maximum health bonus must be a non-negative integer')
    }
    this.maximumHealthBonus = bonus
    const maximum = this.resolvedMaximumHealth()
    if (!this.health.alive) {
      this.health = {
        maximum,
        current: 0,
        alive: false,
      }
      return
    }
    const current = Math.min(this.health.current, maximum)
    this.health = {
      maximum,
      current,
      alive: current > 0,
    }
  }

  resolvedMaximumHealth(): number {
    return this.baseMaximumHealth + this.maximumHealthBonus
  }

  snapshot(): PlayerHealthSnapshot {
    return {
      id: PLAYER_ID,
      health: this.health,
      lifeState: this.health.alive ? 'alive' : 'dead',
      baseMaximumHealth: this.baseMaximumHealth,
      maximumHealthBonus: this.maximumHealthBonus,
      hurtbox: {
        id: PLAYER_HURTBOX_ID,
        ownerId: PLAYER_ID,
        kind: 'sphere',
        center: { ...this.position },
        radius: PLAYER_HURTBOX_RADIUS,
      },
    }
  }
}
