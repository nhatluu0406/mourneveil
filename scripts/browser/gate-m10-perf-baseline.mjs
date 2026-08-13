import { access, constants } from 'node:fs/promises'
import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery } from './freshSession.mjs'

const OUT = 'tmp-m10-perf-baseline'
const PORT = 4198
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

/**
 * Connected-route production ceilings after the M11 final-arena visual slice.
 * Repeated arena modules remain instanced; the object/mesh allowance covers the
 * authored boss rig, fixtures, and VFX while draw/program limits stay bounded.
 */
const PRODUCTION = Object.freeze({
  maxDrawCalls: 340,
  maxTriangles: 80_000,
  maxGeometries: 180,
  maxTextures: 16,
  maxPrograms: 14,
  maxPixelRatio: 1.6,
  maxDrawingBufferPixels: 1440 * 900 * 1.6 * 1.6,
  maxSceneObjects: 540,
  maxMeshes: 330,
  maxLights: 12,
})

function evaluateProduction(stats) {
  const failuresLocal = []
  const pixels = stats.drawingBufferWidth * stats.drawingBufferHeight
  if (stats.drawCalls > PRODUCTION.maxDrawCalls) failuresLocal.push(`drawCalls ${stats.drawCalls}`)
  if (stats.triangles > PRODUCTION.maxTriangles) failuresLocal.push(`triangles ${stats.triangles}`)
  if (stats.geometries > PRODUCTION.maxGeometries) failuresLocal.push(`geometries ${stats.geometries}`)
  if (stats.textures > PRODUCTION.maxTextures) failuresLocal.push(`textures ${stats.textures}`)
  if (stats.programs > PRODUCTION.maxPrograms) failuresLocal.push(`programs ${stats.programs}`)
  if (stats.pixelRatio > PRODUCTION.maxPixelRatio + 1e-6) {
    failuresLocal.push(`pixelRatio ${stats.pixelRatio}`)
  }
  if (pixels > PRODUCTION.maxDrawingBufferPixels) failuresLocal.push(`drawingBufferPixels ${pixels}`)
  if (stats.sceneObjectCount > PRODUCTION.maxSceneObjects) {
    failuresLocal.push(`sceneObjects ${stats.sceneObjectCount}`)
  }
  if (stats.meshCount > PRODUCTION.maxMeshes) failuresLocal.push(`meshes ${stats.meshCount}`)
  if (stats.lightCount > PRODUCTION.maxLights) failuresLocal.push(`lights ${stats.lightCount}`)
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

async function readStats(page) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const stats = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
    if (stats !== null) return stats
    await soak(page, 100)
  }
  throw new Error('renderer stats never published')
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
    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await soak(page, 1500)

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      g.setPlayerPosition({ x: -5.2, y: 0.82, z: 0.4 })
      g.setPlayerFacing({ x: 0, z: -1 })
    })
    await soak(page, 2000)

    const refuge = await readStats(page)
    console.log('REFUGE:', JSON.stringify(refuge, null, 2))
    await page.screenshot({ path: `${OUT}/01-refuge.png`, fullPage: false })
    const refugeSanity = evaluateProduction(refuge)
    refugeSanity.length === 0
      ? pass(
          `refuge production budgets ok drawCalls=${refuge.drawCalls} geo=${refuge.geometries} meshes=${refuge.meshCount}`,
        )
      : fail(`refuge budgets exceeded: ${refugeSanity.join(', ')} (ceilings ${JSON.stringify(PRODUCTION)})`)

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: 1.1, y: 0.82, z: -4.15 })
      g.setPlayerFacing({ x: 1, z: 0 })
    })
    await soak(page, 1600)
    const court = await readStats(page)
    console.log('MIXED COURT:', JSON.stringify(court, null, 2))
    await page.screenshot({ path: `${OUT}/02-mixed-court.png`, fullPage: false })
    const courtSanity = evaluateProduction(court)
    courtSanity.length === 0
      ? pass(
          `mixed-court production budgets ok drawCalls=${court.drawCalls} geo=${court.geometries}`,
        )
      : fail(`mixed-court budgets exceeded: ${courtSanity.join(', ')}`)

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: 6.3, y: 0.82, z: -4.1 })
      g.setPlayerFacing({ x: 1, z: 0 })
    })
    await soak(page, 1600)
    const ash = await readStats(page)
    console.log('ASH WALK:', JSON.stringify(ash, null, 2))
    await page.screenshot({ path: `${OUT}/03-ash-walk.png`, fullPage: false })
    const ashSanity = evaluateProduction(ash)
    ashSanity.length === 0
      ? pass(`ash-walk production budgets ok drawCalls=${ash.drawCalls}`)
      : fail(`ash-walk budgets exceeded: ${ashSanity.join(', ')}`)

    const beforeCombat = await page.evaluate(async () => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.skirmisher.introduction') g.defeatEnemy(enemy.id)
      }
      const intro = g.snapshot().enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
      g.setPlayerPosition({
        x: intro.position.x,
        y: 0.82,
        z: intro.position.z - 0.8,
      })
      g.setPlayerFacing({ x: 0, z: 1 })
      return null
    })
    void beforeCombat
    await soak(page, 1200)
    const before = await readStats(page)
    console.log('BEFORE COMBAT:', JSON.stringify(before, null, 2))

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
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
    const after = await readStats(page)
    console.log('AFTER COMBAT:', JSON.stringify(after, null, 2))

    const geoDelta = after.geometries - before.geometries
    const texDelta = after.textures - before.textures
    const meshDelta = after.meshCount - before.meshCount
    const lightDelta = after.lightCount - before.lightCount
    geoDelta <= 4 && texDelta <= 0 && meshDelta <= 4 && lightDelta <= 0
      ? pass(
          `repeated combat resource growth bounded geoΔ=${geoDelta} texΔ=${texDelta} meshΔ=${meshDelta} lightΔ=${lightDelta}`,
        )
      : fail(
          `resource growth too high geoΔ=${geoDelta} texΔ=${texDelta} meshΔ=${meshDelta} lightΔ=${lightDelta}`,
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
} else if (cleanupReport.artifactCleanup?.kept) {
  pass(`owned artifacts kept (KEEP_ARTIFACTS); port ${PORT} reusable`)
} else if (cleanupReport.artifactCleanup?.kept === false) {
  pass(`owned artifacts removed; port ${PORT} reusable`)
  if (await exists(OUT)) {
    fail(`owned artifact dir still present: ${OUT}`)
  } else {
    pass(`confirmed ${OUT} removed from disk`)
  }
} else {
  fail(`artifact cleanup missing: ${JSON.stringify(cleanupReport.artifactCleanup)}`)
}

if (failures.length > 0) {
  console.error(`\n${failures.length} m10-perf-baseline gate failure(s)`)
  process.exit(1)
}
console.log('\nM10 perf-baseline gate PASS')
