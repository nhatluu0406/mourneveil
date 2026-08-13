import { describe, expect, it } from 'vitest'
import { percentileSorted, summarizeFrameDeltas } from './frameMetrics'

describe('frame metrics', () => {
  it('computes percentiles and long-frame counts from a known series', () => {
    const deltas = [16, 16, 16, 16, 17, 18, 21, 26, 34, 16]
    const summary = summarizeFrameDeltas(deltas)
    expect(summary.sampleCount).toBe(10)
    expect(summary.framesOver20ms).toBe(3)
    expect(summary.framesOver25ms).toBe(2)
    expect(summary.framesOver33ms).toBe(1)
    expect(summary.p50Ms).toBe(16)
    expect(percentileSorted([1, 2, 3, 4], 100)).toBe(4)
  })
})
