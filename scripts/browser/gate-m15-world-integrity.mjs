import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { runOwnedBrowserGate, shouldKeepGateArtifacts } from './runtimeGateLifecycle.mjs'
import { withFreshQuery } from './freshSession.mjs'
import { M15_VIEWPORT, holdKeys, soak } from './m15MotionScenario.mjs'

const OUT = 'tmp-m15-integrity'
const PORT = 4224
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function shot(page, artifactDir, name) {
  if (!artifactDir) return
  await page.screenshot({ path: path.join(artifactDir, `${name}.png`), fullPage: false })
}

const keep = shouldKeepGateArtifacts()
let cleanupReport = null
await runOwnedBrowserGate({
  artifactDir: OUT,
  port: PORT,
  viewport: M15_VIEWPORT,
  deviceScaleFactor: 1,
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl, artifactDir }) => {
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(String(error)))
    await page.goto(withFreshQuery(baseUrl, '?perfHud=1'), { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await soak(page, 800)

    const compiled = await page.evaluate(() => window.__MOURNEVEIL_GATE__.compiledWorld())
    if (compiled.roomCount !== 8) fail(`expected 8 rooms, got ${compiled.roomCount}`)
    else pass(`compiled ${compiled.roomCount} rooms / ${compiled.instanceCount} instances / ${compiled.structuralColliderCount} colliders`)
    for (const [key, value] of Object.entries(compiled.integrity)) {
      if (Array.isArray(value) && value.length > 0) fail(`integrity ${key}: ${JSON.stringify(value)}`)
    }

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      g.setPlayerPosition({ x: -6.4, y: 0.82, z: -1.15 })
      g.setPlayerFacing({ x: -1, z: 0 })
    })
    await holdKeys(page, ['KeyA'], 900)
    const west = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot().player.position)
    if (west.x <= -8) fail(`player crossed refuge west wall to x=${west.x}`)
    else pass(`player west wall blocked at x=${west.x.toFixed(2)}`)
    await shot(page, artifactDir, '04-player-west-wall')

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -6.6, y: 0.82, z: -1.8 })
      g.setPlayerFacing({ x: -1, z: -1 })
    })
    await holdKeys(page, ['KeyA', 'KeyS'], 900)
    await shot(page, artifactDir, '05-player-corner')

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -9.6, y: 0.82, z: 3.2 })
      g.setPlayerFacing({ x: 1, z: 0 })
    })
    await soak(page, 500)
    await shot(page, artifactDir, '06-enemy-wall-block')

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -6.6, y: 0.82, z: 1 })
      g.setPlayerFacing({ x: -1, z: 0 })
    })
    await soak(page, 500)
    await shot(page, artifactDir, '07-enemy-door-route')

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -1.6, y: 0.82, z: -1.2 })
      g.setPlayerFacing({ x: -1, z: 0 })
    })
    await soak(page, 500)
    await shot(page, artifactDir, '08-gate-closed')

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -4.4, y: 0.82, z: -1.2 })
      g.setPlayerFacing({ x: 1, z: 0 })
      g.interactWorld()
      g.advance(12)
    })
    await soak(page, 700)
    await shot(page, artifactDir, '09-gate-open')

    for (const shotSpec of [
      { name: '13-refuge-room', position: { x: -5.2, y: 0.82, z: 0.4 }, facing: { x: 0, z: -1 } },
      { name: '14-court-room', position: { x: -1, y: 0.82, z: -4 }, facing: { x: 1, z: 0 } },
      { name: '15-sepulchre-room', position: { x: 13, y: 0.82, z: -4 }, facing: { x: -1, z: 0 } },
    ]) {
      await page.evaluate(({ position, facing }) => {
        const g = window.__MOURNEVEIL_GATE__
        g.setPlayerPosition(position)
        g.setPlayerFacing(facing)
      }, shotSpec)
      await soak(page, 550)
      await shot(page, artifactDir, shotSpec.name)
    }

    const stats = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
    console.log(
      `PERF draw=${stats?.drawCalls} tri=${stats?.triangles} objects=${stats?.sceneObjectCount} meshes=${stats?.meshCount} lights=${stats?.lightCount} heap=${stats?.jsHeapUsedBytes}`,
    )
    if (pageErrors.length > 0) fail(`page errors: ${pageErrors.join(' | ')}`)
  },
})

if (!cleanupReport?.browserClosed || !cleanupReport?.serverExited) {
  fail(`cleanup incomplete: ${JSON.stringify(cleanupReport)}`)
}
if (!keep) console.log('OK: artifacts cleaned (KEEP_ARTIFACTS unset)')
if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} world-integrity checks`)
  process.exit(1)
}
console.log('OK: gate:m15-world-integrity')
