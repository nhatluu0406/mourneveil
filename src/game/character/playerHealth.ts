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
}

export class PlayerHealthRuntime {
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
    this.health = createCombatHealth(PLAYER_MAXIMUM_HEALTH)
  }

  snapshot(): PlayerHealthSnapshot {
    return {
      id: PLAYER_ID,
      health: this.health,
      lifeState: this.health.alive ? 'alive' : 'dead',
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
