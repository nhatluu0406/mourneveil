export interface CombatHealthState {
  readonly maximum: number
  readonly current: number
  readonly alive: boolean
}

export interface CombatDamageResult {
  readonly applied: boolean
  readonly appliedDamage: number
  readonly health: CombatHealthState
}

export interface CombatHealthRestoreResult {
  readonly applied: boolean
  readonly restoredHealth: number
  readonly health: CombatHealthState
}

export function createCombatHealth(maximum: number): CombatHealthState {
  assertPositiveFinite(maximum, 'Maximum health')
  return Object.freeze({ maximum, current: maximum, alive: true })
}

export function applyCombatDamage(
  health: CombatHealthState,
  damage: number,
): CombatDamageResult {
  assertPositiveFinite(damage, 'Damage')
  if (!health.alive) {
    return { applied: false, appliedDamage: 0, health }
  }

  const current = Math.max(0, health.current - damage)
  const nextHealth = Object.freeze({
    maximum: health.maximum,
    current,
    alive: current > 0,
  })
  return {
    applied: true,
    appliedDamage: health.current - current,
    health: nextHealth,
  }
}

export function restoreCombatHealth(
  health: CombatHealthState,
  amount: number,
): CombatHealthRestoreResult {
  assertPositiveFinite(amount, 'Health restoration')
  if (!health.alive || health.current >= health.maximum) {
    return { applied: false, restoredHealth: 0, health }
  }

  const current = Math.min(health.maximum, health.current + amount)
  const nextHealth = Object.freeze({
    maximum: health.maximum,
    current,
    alive: true,
  })
  return {
    applied: true,
    restoredHealth: current - health.current,
    health: nextHealth,
  }
}

export function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite positive number`)
  }
}
