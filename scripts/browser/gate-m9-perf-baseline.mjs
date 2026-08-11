import { access, constants } from 'node:fs/promises'
import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m9-perf-baseline'
const PORT = 4196
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

/** Mirrors src/debug/rendererStats.ts ceilings (keep in sync). */
const SANITY = Object.freeze({
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

function evaluateSanity(stats) {
  const failuresLocal = []
  const pixels = stats.drawingBufferWidth * stats.drawingBufferHeight
  if (stats.drawCalls > SANITY.maxDrawCalls) failuresLocal.push(`drawCalls ${stats.drawCalls}`)
  if (stats.triangles > SANITY.maxTriangles) failuresLocal.push(`triangles ${stats.triangles}`)
  if (stats.geometries > SANITY.maxGeometries) failuresLocal.push(`geometries ${stats.geometries}`)
  if (stats.textures > SANITY.maxTextures) failuresLocal.push(`textures ${stats.textures}`)
  if (stats.programs > SANITY.maxPrograms) failuresLocal.push(`programs ${stats.programs}`)
  if (stats.pixelRatio > SANITY.maxPixelRatio + 1e-6) {
    failuresLocal.push(`pixelRatio ${stats.pixelRatio}`)
  }
  if (pixels > SANITY.maxDrawingBufferPixels) failuresLocal.push(`drawingBufferPixels ${pixels}`)
  if (stats.sceneObjectCount > SANITY.maxSceneObjects) {
    failuresLocal.push(`sceneObjects ${stats.sceneObjectCount}`)
  }
  if (stats.meshCount > SANITY.maxMeshes) failuresLocal.push(`meshes ${stats.meshCount}`)
  if (stats.lightCount > SANITY.maxLights) failuresLocal.push(`lights ${stats.lightCount}`)
  return failuresLocal
}

async function soak(page, ms) {
  const slice = 40
  for (let i = 0; i < Math.ceil(ms / slice); i += 1) await page.waitForTimeout(slice)
}

async function exists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

let cleanupReport = null
await runOwnedBrowserGate({
  port: PORT,
  artifactDir: OUT,
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl }) => {
    const pageErrors = []
    page.on('pageerror', (error) => {
      pageErrors.push(String(error))
      console.error(`PAGE ERROR: ${error}`)
    })
    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await soak(page, 1500)

    // Idle at checkpoint: restore + park near refuge.
    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      g.setPlayerPosition({ x: -5.2, y: 0.82, z: 0.4 })
      g.setPlayerFacing({ x: 0, z: -1 })
    })
    await soak(page, 2000)

    let stats = null
    for (let attempt = 0; attempt < 20; attempt += 1) {
      stats = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
      if (stats !== null) break
      await soak(page, 100)
    }
    if (stats === null) throw new Error('renderer stats never published')

    console.log('BASELINE:', JSON.stringify(stats, null, 2))
    await page.screenshot({ path: `${OUT}/01-idle-checkpoint.png`, fullPage: false })

    const sanity = evaluateSanity(stats)
    sanity.length === 0
      ? pass(
          `idle renderer sanity ok drawCalls=${stats.drawCalls} tris=${stats.triangles} dpr=${stats.pixelRatio}`,
        )
      : fail(`renderer sanity exceeded: ${sanity.join(', ')} (ceilings ${JSON.stringify(SANITY)})`)

    // Repeated light/heavy contact should not grow geometries/textures unboundedly.
    const before = stats
    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.skirmisher.introduction') g.defeatEnemy(enemy.id)
      }
      const intro = g.snapshot().enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
      for (let i = 0; i < 12; i += 1) {
        while (g.snapshot().combat.phase !== 'idle') g.advance(1)
        g.restorePlayer()
        g.setPlayerPosition({
          x: intro.position.x,
          y: 0.82,
          z: intro.position.z - 0.8,
        })
        g.setPlayerFacing({ x: 0, z: 1 })
        g.requestAttack({ x: 0, z: 1 }, i % 2 === 0 ? 'light' : 'heavy')
        for (let step = 0; step < 40; step += 1) g.advance(1)
      }
    })
    await soak(page, 1200)
    const after = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
    if (after === null) throw new Error('post-combat renderer stats missing')
    console.log('AFTER COMBAT:', JSON.stringify(after, null, 2))

    const geoDelta = after.geometries - before.geometries
    const texDelta = after.textures - before.textures
    const meshDelta = after.meshCount - before.meshCount
    geoDelta <= 8 && texDelta <= 4 && meshDelta <= 12
      ? pass(
          `repeated combat resource growth bounded geoΔ=${geoDelta} texΔ=${texDelta} meshΔ=${meshDelta}`,
        )
      : fail(
          `resource growth too high geoΔ=${geoDelta} texΔ=${texDelta} meshΔ=${meshDelta}`,
        )

    pageErrors.length === 0 ? pass('no uncaught page errors') : fail(pageErrors.join(' | '))
  },
})

if (
  cleanupReport === null ||
  !cleanupReport.pageClosed ||
  !cleanupReport.browserClosed ||
  !cleanupReport.serverExited ||
  !cleanupReport.portReusable
) {
  fail(`owned cleanup failed: ${JSON.stringify(cleanupReport)}`)
} else if (cleanupReport.artifactCleanup?.kept === false) {
  pass(`owned artifacts removed; port ${PORT} reusable`)
} else if (cleanupReport.artifactCleanup?.kept) {
  pass(`owned artifacts kept (KEEP_ARTIFACTS); port ${PORT} reusable`)
} else {
  fail(`artifact cleanup missing: ${JSON.stringify(cleanupReport.artifactCleanup)}`)
}

if (await exists(OUT)) {
  fail(`owned artifact dir still present: ${OUT}`)
} else {
  pass(`confirmed ${OUT} removed from disk`)
}

if (failures.length > 0) {
  console.error(`\n${failures.length} perf-baseline gate failure(s)`)
  process.exit(1)
}
console.log('\nM9 perf-baseline gate PASS')
