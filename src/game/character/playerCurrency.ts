export const ECHOES_CURRENCY_ID = 'currency.echoes' as const

export interface EchoesSnapshot {
  readonly currencyId: typeof ECHOES_CURRENCY_ID
  readonly carried: number
}

export class EchoesCurrencyRuntime {
  private carried = 0

  add(amount: number): number {
    assertNonNegativeInteger(amount, 'Echoes add amount')
    this.carried += amount
    return this.carried
  }

  spend(amount: number): { readonly accepted: true; readonly carried: number } | {
    readonly accepted: false
    readonly reason: 'insufficient'
    readonly carried: number
  } {
    assertNonNegativeInteger(amount, 'Echoes spend amount')
    if (amount > this.carried) {
      return { accepted: false, reason: 'insufficient', carried: this.carried }
    }
    this.carried -= amount
    return { accepted: true, carried: this.carried }
  }

  /** Removes all carried Echoes and returns the dropped amount. */
  dropAll(): number {
    const dropped = this.carried
    this.carried = 0
    return dropped
  }

  setCarried(amount: number): void {
    assertNonNegativeInteger(amount, 'Echoes carried amount')
    this.carried = amount
  }

  reset(): void {
    this.carried = 0
  }

  snapshot(): EchoesSnapshot {
    return {
      currencyId: ECHOES_CURRENCY_ID,
      carried: this.carried,
    }
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`)
  }
}
