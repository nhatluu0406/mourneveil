import { describe, expect, it } from 'vitest'
import { isM15Baseline, isZoneCullEnabled, shouldShowPerfHud } from './devQuery'

describe('dev query flags', () => {
  it('shows the FPS box only in development via F3 or ?perfHud=1', () => {
    expect(shouldShowPerfHud('', false, true)).toBe(false)
    expect(shouldShowPerfHud('', true, false)).toBe(false)
    expect(shouldShowPerfHud('?perfHud=1', true, false)).toBe(true)
    expect(shouldShowPerfHud('', true, true)).toBe(true)
  })

  it('detects the M15 baseline A/B flag', () => {
    expect(isM15Baseline('')).toBe(false)
    expect(isM15Baseline('?m15Baseline=1')).toBe(true)
    expect(isZoneCullEnabled('')).toBe(true)
    expect(isZoneCullEnabled('?zoneCull=0')).toBe(false)
    expect(isZoneCullEnabled('?m15Baseline=1')).toBe(false)
  })
})
