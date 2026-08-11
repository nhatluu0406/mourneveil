export interface RendererStatsSnapshot {
  readonly drawCalls: number
  readonly triangles: number
  readonly geometries: number
  readonly textures: number
  readonly programs: number
  readonly calls: number
  readonly points: number
  readonly lines: number
  readonly pixelRatio: number
  readonly drawingBufferWidth: number
  readonly drawingBufferHeight: number
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly shadowMapEnabled: boolean
  readonly shadowMapSize: number | null
  readonly sceneObjectCount: number
  readonly meshCount: number
  readonly lightCount: number
  readonly jsHeapUsedBytes: number | null
  readonly jsHeapTotalBytes: number | null
  readonly devicePixelRatio: number
}

let latest: RendererStatsSnapshot | null = null

export function publishRendererStats(snapshot: RendererStatsSnapshot): void {
  latest = snapshot
}

export function readRendererStats(): RendererStatsSnapshot | null {
  return latest
}

/** Generous sanity ceilings for accidental duplicate mounts / runaway growth. */
export const RENDERER_STATS_SANITY = Object.freeze({
  maxDrawCalls: 450,
  maxTriangles: 250_000,
  maxGeometries: 400,
  maxTextures: 80,
  maxPrograms: 60,
  maxPixelRatio: 1.6,
  maxDrawingBufferPixels: 1440 * 900 * 1.6 * 1.6,
  maxSceneObjects: 900,
  maxMeshes: 450,
  maxLights: 12,
})

export function evaluateRendererStatsSanity(
  stats: RendererStatsSnapshot,
): readonly string[] {
  const failures: string[] = []
  const pixels = stats.drawingBufferWidth * stats.drawingBufferHeight
  if (stats.drawCalls > RENDERER_STATS_SANITY.maxDrawCalls) {
    failures.push(`drawCalls ${stats.drawCalls}`)
  }
  if (stats.triangles > RENDERER_STATS_SANITY.maxTriangles) {
    failures.push(`triangles ${stats.triangles}`)
  }
  if (stats.geometries > RENDERER_STATS_SANITY.maxGeometries) {
    failures.push(`geometries ${stats.geometries}`)
  }
  if (stats.textures > RENDERER_STATS_SANITY.maxTextures) {
    failures.push(`textures ${stats.textures}`)
  }
  if (stats.programs > RENDERER_STATS_SANITY.maxPrograms) {
    failures.push(`programs ${stats.programs}`)
  }
  if (stats.pixelRatio > RENDERER_STATS_SANITY.maxPixelRatio + 1e-6) {
    failures.push(`pixelRatio ${stats.pixelRatio}`)
  }
  if (pixels > RENDERER_STATS_SANITY.maxDrawingBufferPixels) {
    failures.push(`drawingBufferPixels ${pixels}`)
  }
  if (stats.sceneObjectCount > RENDERER_STATS_SANITY.maxSceneObjects) {
    failures.push(`sceneObjects ${stats.sceneObjectCount}`)
  }
  if (stats.meshCount > RENDERER_STATS_SANITY.maxMeshes) {
    failures.push(`meshes ${stats.meshCount}`)
  }
  if (stats.lightCount > RENDERER_STATS_SANITY.maxLights) {
    failures.push(`lights ${stats.lightCount}`)
  }
  return failures
}
