import type { Vector3Value } from '../character/playerMotor'
import type { CombatDamageResult, CombatHealthState } from './combatHealth'

export type CombatTargetId = string
export type CombatHurtboxId = string

export interface SphereHurtbox {
  readonly id: CombatHurtboxId
  readonly ownerId: CombatTargetId
  readonly kind: 'sphere'
  readonly center: Vector3Value
  readonly radius: number
}

export interface CombatTargetSnapshot {
  readonly id: CombatTargetId
  readonly hurtbox: SphereHurtbox
  readonly health: CombatHealthState
}

export interface DamageableCombatTarget {
  snapshot(): CombatTargetSnapshot
  applyDamage(damage: number): CombatDamageResult
}
