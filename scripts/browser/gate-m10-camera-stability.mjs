import { access, constants } from 'node:fs/promises'
import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery } from './freshSession.mjs'

const OUT = 'tmp-m10-camera-stability'
const PORT = 4201
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

/** Max lookAt planar jump between settled locomotion samples (meters). */
const MAX_LOOKAT_STEP = 1.25
/** Max alternating reverse count allowed across the sample window. */
const MAX_DIRECTION_REVERSALS = 4
const WARMUP_SAMPLES = 8

async function soak(page, ms) {
  for (let i = 0; i < Math.ceil(ms / 40); i += 1) await page.waitForTimeout(40)
}

async function exists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

function analyzeLookAtSeries(samples) {
  let maxStep = 0
  let reversals = 0
  let previousDelta = null
  for (let i = 1; i < samples.length; i += 1) {
    const prev = samples[i - 1].lookAt
    const cur = samples[i].lookAt
    const dx = cur.x - prev.x
    const dz = cur.z - prev.z
    const step = Math.hypot(dx, dz)
    maxStep = Math.max(maxStep, step)
    if (previousDelta !== null) {
      const dot = previousDelta.dx * dx + previousDelta.dz * dz
      if (dot < -1e-6 && previousDelta.step > 0.02 && step > 0.02) reversals += 1
    }
    previousDelta = { dx, dz, step }
  }
  return { maxStep, reversals, count: samples.length }
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
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await soak(page, 1200)

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      g.setPlayerPosition({ x: -5.2, y: 0.82, z: 0.4 })
      g.setPlayerFacing({ x: 1, z: 0 })
    })
    await soak(page, 600)

    async function sampleWhileMoving(movement, frames, label) {
      await page.evaluate((intent) => {
        window.__MOURNEVEIL_GATE__.setMovementOverride(intent)
      }, movement)
      await soak(page, 350)
      const samples = []
      for (let i = 0; i < frames; i += 1) {
        await page.evaluate(() => window.__MOURNEVEIL_GATE__.advance(1, { horizontal: 0, forward: 0 }))
        await soak(page, 20)
        const diagnostic = await page.evaluate(() => window.__MOURNEVEIL_GATE__.cameraDiagnostic())
        if (diagnostic?.followLookAt) {
          samples.push({
            lookAt: diagnostic.followLookAt,
            camera: diagnostic.cameraPosition,
            lookAhead: diagnostic.lookAheadDir,
          })
        }
      }
      await page.evaluate(() => window.__MOURNEVEIL_GATE__.setMovementOverride(null))
      const settled = samples.slice(WARMUP_SAMPLES)
      const analysis = analyzeLookAtSeries(settled)
      console.log(`${label}:`, JSON.stringify(analysis))
      analysis.count >= 8
        ? pass(`${label} sampled ${analysis.count} settled frames`)
        : fail(`${label} insufficient samples (${analysis.count})`)
      analysis.maxStep <= MAX_LOOKAT_STEP
        ? pass(`${label} lookAt step bounded (${analysis.maxStep.toFixed(3)})`)
        : fail(`${label} lookAt step too large (${analysis.maxStep.toFixed(3)})`)
      analysis.reversals <= MAX_DIRECTION_REVERSALS
        ? pass(`${label} reversal count ok (${analysis.reversals})`)
        : fail(`${label} too many lookAt reversals (${analysis.reversals})`)
      return samples
    }

    async function park(position, facing) {
      await page.evaluate(({ position: next, facing: dir }) => {
        const g = window.__MOURNEVEIL_GATE__
        g.setMovementOverride(null)
        g.setPlayerPosition(next)
        g.setPlayerFacing(dir)
      }, { position, facing })
      await soak(page, 700)
    }

    await park({ x: -5.2, y: 0.82, z: 0.4 }, { x: 1, z: 0 })
    await sampleWhileMoving({ horizontal: 1, forward: 0 }, 40, 'straight')
    await page.screenshot({ path: `${OUT}/01-straight.png`, fullPage: false })

    await park({ x: -5.2, y: 0.82, z: 0.4 }, { x: 1, z: 1 })
    await sampleWhileMoving({ horizontal: 0.7, forward: 0.7 }, 40, 'diagonal')
    await page.screenshot({ path: `${OUT}/02-diagonal.png`, fullPage: false })

    await park({ x: -5.0, y: 0.82, z: 0.2 }, { x: 1, z: 0 })
    await sampleWhileMoving({ horizontal: 1, forward: 0 }, 24, 'eastbound')
    await sampleWhileMoving({ horizontal: -1, forward: 0 }, 32, 'reverse')
    await page.screenshot({ path: `${OUT}/03-reverse.png`, fullPage: false })

    await park({ x: -3.7, y: 0.82, z: -3.6 }, { x: 0, z: -1 })
    await sampleWhileMoving({ horizontal: 0, forward: -1 }, 32, 'wall-slide')
    await page.screenshot({ path: `${OUT}/04-wall-slide.png`, fullPage: false })

    await park({ x: -7.9, y: 0.82, z: 1.65 }, { x: -0.4, z: 0.8 })
    await sampleWhileMoving({ horizontal: -0.4, forward: 0.8 }, 32, 'corridor')
    await page.screenshot({ path: `${OUT}/05-corridor.png`, fullPage: false })

    await park({ x: 1.1, y: 0.82, z: -4.15 }, { x: 1, z: 0 })
    await sampleWhileMoving({ horizontal: 0.6, forward: -0.4 }, 32, 'mixed-court')
    await page.screenshot({ path: `${OUT}/06-mixed-court.png`, fullPage: false })

    await park({ x: 6.3, y: 0.82, z: -4.1 }, { x: 1, z: 0 })
    await sampleWhileMoving({ horizontal: 0.8, forward: 0 }, 32, 'ash-walk')
    await page.screenshot({ path: `${OUT}/07-ash-walk.png`, fullPage: false })

    await park({ x: -5.2, y: 0.82, z: 0.4 }, { x: 1, z: 0 })
    await page.evaluate(() => {
      window.__MOURNEVEIL_GATE__.setMovementOverride({ horizontal: 1, forward: 0 })
    })
    await soak(page, 200)
    await page.keyboard.down('Space')
    await soak(page, 80)
    await page.keyboard.up('Space')
    for (let i = 0; i < 20; i += 1) {
      await page.evaluate(() => window.__MOURNEVEIL_GATE__.advance(1))
      await soak(page, 16)
    }
    await page.evaluate(() => window.__MOURNEVEIL_GATE__.setMovementOverride(null))
    await page.screenshot({ path: `${OUT}/08-dodge.png`, fullPage: false })
    pass('dodge sequence captured')

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
  if (await exists(OUT)) fail(`owned artifact dir still present: ${OUT}`)
  else pass(`confirmed ${OUT} removed from disk`)
} else {
  fail(`artifact cleanup missing: ${JSON.stringify(cleanupReport.artifactCleanup)}`)
}

if (failures.length > 0) {
  console.error(`\n${failures.length} m10-camera-stability gate failure(s)`)
  process.exit(1)
}
console.log('\nM10 camera-stability gate PASS')
