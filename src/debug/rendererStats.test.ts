import { describe, expect, it } from 'vitest'
import {
  evaluateRendererStatsSanity,
  RENDERER_STATS_SANITY,
  type RendererStatsSnapshot,
} from './rendererStats'

function sample(overrides: Partial<RendererStatsSnapshot> = {}): RendererStatsSnapshot {
  return {
    drawCalls: 80,
    triangles: 40_000,
    geometries: 60,
    textures: 10,
    programs: 12,
    calls: 80,
    points: 0,
    lines: 0,
    pixelRatio: 1.5,
    drawingBufferWidth: 1440,
    drawingBufferHeight: 900,
    canvasWidth: 1440,
    canvasHeight: 900,
    shadowMapEnabled: true,
    shadowMapSize: 1024,
    sceneObjectCount: 120,
    meshCount: 80,
    lightCount: 7,
    jsHeapUsedBytes: null,
    jsHeapTotalBytes: null,
    devicePixelRatio: 1.5,
    ...overrides,
  }
}

describe('renderer stats sanity', () => {
  it('accepts a healthy baseline sample', () => {
    expect(evaluateRendererStatsSanity(sample())).toEqual([])
  })

  it('flags runaway draw calls and DPR regressions', () => {
    expect(
      evaluateRendererStatsSanity(
        sample({
          drawCalls: RENDERER_STATS_SANITY.maxDrawCalls + 1,
          pixelRatio: 2.5,
        }),
      ),
    ).toEqual([
      `drawCalls ${RENDERER_STATS_SANITY.maxDrawCalls + 1}`,
      'pixelRatio 2.5',
    ])
  })
})
