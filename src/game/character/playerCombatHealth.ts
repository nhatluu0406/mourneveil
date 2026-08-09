import {
  applyCombatDamage,
  createCombatHealth,
  type CombatDamageResult,
  type CombatHealthState,
} from '../combat/combatHealth'
import type { CombatTargetSnapshot, SphereHurtbox } from '../combat/combatTarget'
import type { Vector3Value } from './playerMotor'

export const PLAYER_COMBAT_ID = 'player' as const
export const PLAYER_MAXIMUM_HEALTH = 100
export const PLAYER_HURTBOX_ID = 'player.hurtbox' as const
export const PLAYER_HURTBOX_RADIUS = 0.42

export interface PlayerCombatSnapshot extends CombatTargetSnapshot {
  readonly id: typeof PLAYER_COMBAT_ID
  readonly hurtbox: SphereHurtbox
  readonly health: CombatHealthState
  readonly defeated: boolean
}

export class PlayerCombatHealthRuntime {
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

  reset(): void {
    this.health = createCombatHealth(PLAYER_MAXIMUM_HEALTH)
  }

  snapshot(): PlayerCombatSnapshot {
    return {
      id: PLAYER_COMBAT_ID,
      health: this.health,
      defeated: !this.health.alive,
      hurtbox: {
        id: PLAYER_HURTBOX_ID,
        ownerId: PLAYER_COMBAT_ID,
        kind: 'sphere',
        center: { ...this.position },
        radius: PLAYER_HURTBOX_RADIUS,
      },
    }
  }
}
