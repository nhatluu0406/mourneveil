import type { Vector3Value } from '../character/playerMotor'

export const ECHO_RECOVERY_ID = 'world.echo-recovery' as const
export const ECHO_RECOVERY_PICKUP_RANGE = 1.05

export interface EchoRecoverySnapshot {
  readonly id: typeof ECHO_RECOVERY_ID
  readonly active: boolean
  readonly amount: number
  readonly position: Vector3Value | null
}

export type EchoRecoveryPickupResult =
  | { readonly accepted: true; readonly amount: number }
  | { readonly accepted: false; readonly reason: 'inactive' | 'out-of-range' | 'actor-dead' }

/**
 * At most one active Echo death recovery. A later death replaces any prior drop.
 * Zero-amount deaths clear prior recovery without creating a new marker.
 */
export class EchoRecoveryRuntime {
  private active = false
  private amount = 0
  private position: Vector3Value | null = null

  dropAt(position: Vector3Value, amount: number): void {
    assertFiniteVector(position, 'Echo recovery position')
    assertNonNegativeInteger(amount, 'Echo recovery amount')
    if (amount === 0) {
      this.clear()
      return
    }
    this.active = true
    this.amount = amount
    this.position = { ...position }
  }

  tryPickup(playerPosition: Vector3Value, playerAlive: boolean): EchoRecoveryPickupResult {
    if (!playerAlive) return { accepted: false, reason: 'actor-dead' }
    if (!this.active || this.position === null) return { accepted: false, reason: 'inactive' }
    assertFiniteVector(playerPosition, 'Echo recovery player position')
    if (horizontalDistance(playerPosition, this.position) > ECHO_RECOVERY_PICKUP_RANGE) {
      return { accepted: false, reason: 'out-of-range' }
    }
    const amount = this.amount
    this.clear()
    return { accepted: true, amount }
  }

  clear(): void {
    this.active = false
    this.amount = 0
    this.position = null
  }

  restore(snapshot: {
    readonly active: boolean
    readonly amount: number
    readonly position: Vector3Value | null
  }): void {
    if (!snapshot.active || snapshot.amount <= 0 || snapshot.position === null) {
      this.clear()
      return
    }
    assertNonNegativeInteger(snapshot.amount, 'Echo recovery restore amount')
    assertFiniteVector(snapshot.position, 'Echo recovery restore position')
    this.active = true
    this.amount = snapshot.amount
    this.position = { ...snapshot.position }
  }

  snapshot(): EchoRecoverySnapshot {
    return {
      id: ECHO_RECOVERY_ID,
      active: this.active,
      amount: this.amount,
      position: this.position === null ? null : { ...this.position },
    }
  }
}

function horizontalDistance(left: Vector3Value, right: Vector3Value): number {
  return Math.hypot(left.x - right.x, left.z - right.z)
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`)
  }
}

function assertFiniteVector(value: Vector3Value, label: string): void {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must contain only finite values`)
  }
}
