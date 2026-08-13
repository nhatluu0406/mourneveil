import { describe, expect, it } from 'vitest'
import { isFreshSessionQuery, resolveInitialSessionIntent } from './sessionIntent'

describe('session intent query', () => {
  it('treats ?fresh=1 as an immediate new rite', () => {
    expect(isFreshSessionQuery('?fresh=1')).toBe(true)
    expect(isFreshSessionQuery('?perfHud=1&fresh=true')).toBe(true)
    expect(isFreshSessionQuery('?perfHud=1')).toBe(false)
    expect(resolveInitialSessionIntent('?fresh=1')).toBe('new-rite')
    expect(resolveInitialSessionIntent('')).toBe(null)
  })
})
