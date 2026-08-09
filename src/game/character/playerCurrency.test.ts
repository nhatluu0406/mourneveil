import { describe, expect, it } from 'vitest'
import { EchoesCurrencyRuntime } from './playerCurrency'

describe('EchoesCurrencyRuntime', () => {
  it('starts at zero and adds non-negative integers', () => {
    const echoes = new EchoesCurrencyRuntime()
    expect(echoes.snapshot()).toEqual({ currencyId: 'currency.echoes', carried: 0 })
    expect(echoes.add(25)).toBe(25)
    expect(echoes.add(60)).toBe(85)
    expect(echoes.snapshot().carried).toBe(85)
  })

  it('rejects spend beyond carried and dropAll clears carried', () => {
    const echoes = new EchoesCurrencyRuntime()
    echoes.add(40)
    expect(echoes.spend(50)).toEqual({
      accepted: false,
      reason: 'insufficient',
      carried: 40,
    })
    expect(echoes.spend(15)).toEqual({ accepted: true, carried: 25 })
    expect(echoes.dropAll()).toBe(25)
    expect(echoes.snapshot().carried).toBe(0)
  })

  it('rejects non-integer or negative mutations', () => {
    const echoes = new EchoesCurrencyRuntime()
    expect(() => echoes.add(-1)).toThrow(/non-negative integer/)
    expect(() => echoes.add(1.5)).toThrow(/non-negative integer/)
    expect(() => echoes.setCarried(-2)).toThrow(/non-negative integer/)
  })
})
