import { describe, expect, it } from 'vitest'
import {
  pushMotionSample,
  resetMotionTelemetry,
  summarizeMotionSamples,
  type MotionSample,
} from './motionTelemetry'

function sample(overrides: Partial<MotionSample> = {}): MotionSample {
  return {
    timeMs: 0,
    rafDeltaMs: 16.6,
    simSteps: 1,
    discardedSeconds: 0,
    simX: 0,
    simY: 0.82,
    simZ: 0,
    presX: 0,
    presY: 0.82,
    presZ: 0,
    camX: 6,
    camY: 8,
    camZ: 6,
    lookX: 0,
    lookY: 0.67,
    lookZ: 0,
    lookAheadX: 0,
    lookAheadZ: -1,
    screenX: 720,
    screenY: 450,
    playerPixelHeight: 80,
    impulseMeters: 0,
    drawCalls: 300,
    triangles: 30_000,
    sceneObjects: 500,
    meshes: 300,
    ...overrides,
  }
}

describe('motion telemetry', () => {
  it('flags a reversal spike and records screen variance', () => {
    resetMotionTelemetry()
    const list = [
      sample({ camX: 0, camZ: 0 }),
      sample({ camX: 0.2, camZ: 0 }),
      sample({ camX: 0, camZ: 0 }),
      sample({ screenX: 700 }),
      sample({ screenX: 740 }),
    ]
    for (const entry of list) pushMotionSample(entry)
    const summary = summarizeMotionSamples(list)
    expect(summary.camera.reversalSpikes).toBeGreaterThanOrEqual(1)
    expect(summary.camera.screenXVariance).toBeGreaterThan(0)
    expect(summary.frames.sampleCount).toBe(5)
  })
})
