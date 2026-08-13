export interface FrameDeltaSummary {
  readonly sampleCount: number
  readonly fps: number
  readonly p50Ms: number
  readonly p95Ms: number
  readonly p99Ms: number
  readonly meanMs: number
  readonly framesOver20ms: number
  readonly framesOver25ms: number
  readonly framesOver33ms: number
}

export function percentileSorted(sortedAscending: readonly number[], p: number): number {
  if (sortedAscending.length === 0) return 0
  const rank = Math.min(
    sortedAscending.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedAscending.length) - 1),
  )
  return sortedAscending[rank]!
}

export function summarizeFrameDeltas(deltasMs: readonly number[]): FrameDeltaSummary {
  if (deltasMs.length === 0) {
    return {
      sampleCount: 0,
      fps: 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
      meanMs: 0,
      framesOver20ms: 0,
      framesOver25ms: 0,
      framesOver33ms: 0,
    }
  }
  const sorted = [...deltasMs].sort((a, b) => a - b)
  const meanMs = deltasMs.reduce((sum, value) => sum + value, 0) / deltasMs.length
  return {
    sampleCount: deltasMs.length,
    fps: meanMs > 1e-6 ? 1000 / meanMs : 0,
    p50Ms: percentileSorted(sorted, 50),
    p95Ms: percentileSorted(sorted, 95),
    p99Ms: percentileSorted(sorted, 99),
    meanMs,
    framesOver20ms: deltasMs.filter((value) => value > 20).length,
    framesOver25ms: deltasMs.filter((value) => value > 25).length,
    framesOver33ms: deltasMs.filter((value) => value > 33).length,
  }
}
