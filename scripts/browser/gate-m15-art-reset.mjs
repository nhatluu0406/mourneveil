import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { runOwnedBrowserGate, shouldKeepGateArtifacts } from './runtimeGateLifecycle.mjs'
import { withFreshQuery } from './freshSession.mjs'

const OUT = 'tmp-m15-art-reset'
const VIEWPORT = { width: 1440, height: 900 }
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function boot(page, baseUrl, query = '?perfHud=1') {
  await page.goto(withFreshQuery(baseUrl, query), { waitUntil: 'load' })
  await page.waitForSelector('canvas', { timeout: 30_000 })
  await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
    timeout: 30_000,
  })
  await page.waitForTimeout(900)
}

async function stage(page, position, facing = { x: 1, z: 0 }) {
  await page.evaluate(({ position, facing }) => {
    const gate = window.__MOURNEVEIL_GATE__
    gate.resetMeleeFixture()
    gate.restorePlayer()
    gate.setPlayerPosition(position)
    gate.setPlayerFacing(facing)
  }, { position, facing })
  await page.waitForTimeout(650)
}

async function shot(page, artifactDir, name) {
  if (!artifactDir) return
  await page.screenshot({ path: path.join(artifactDir, `${name}.png`), fullPage: false })
}

async function sample(page) {
  await page.evaluate(() => window.__MOURNEVEIL_GATE__.resetMotionTelemetry())
  await page.waitForTimeout(3200)
  return page.evaluate(() => ({
    renderer: window.__MOURNEVEIL_GATE__.rendererStats(),
    motion: window.__MOURNEVEIL_GATE__.motionTelemetry(),
  }))
}

const keep = shouldKeepGateArtifacts()
let cleanupReport = null
let dprOne = null
let shadowOn = null
let dprCapped = null

await runOwnedBrowserGate({
  artifactDir: OUT,
  port: 4227,
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
  recordVideo: keep,
  videoFileName: '17-motion-evidence.webm',
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl, artifactDir }) => {
    if (artifactDir) await mkdir(artifactDir, { recursive: true })
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(String(error)))

    // Same-build baseline framing retained for camera/composition comparison.
    await boot(page, baseUrl, '?m15Baseline=1&perfHud=1')
    await stage(page, { x: -9.15, y: 0.82, z: 2.15 })
    await shot(page, artifactDir, '01-outer-watch-before')

    await boot(page, baseUrl)
    const route = [
      ['02-outer-watch-after', { x: -9.15, y: 0.82, z: 2.15 }],
      ['03-refuge-after', { x: -5.2, y: 0.82, z: 0.4 }],
      ['04-court-after', { x: -1, y: 0.82, z: -4 }],
      ['05-ash-walk-after', { x: 5.5, y: 0.82, z: -4.1 }],
      ['06-sepulchre-after', { x: 13, y: 0.82, z: -4 }],
    ]
    for (const [name, position] of route) {
      await stage(page, position)
      await shot(page, artifactDir, name)
    }

    await stage(page, { x: -5.2, y: 0.82, z: 0.4 }, { x: 0, z: -1 })
    await shot(page, artifactDir, '07-player-idle')
    await page.locator('canvas').click({ position: { x: 720, y: 450 } })
    await page.keyboard.down('KeyW')
    await page.waitForTimeout(150)
    await shot(page, artifactDir, '08-player-walk-contact')
    await page.waitForTimeout(140)
    await shot(page, artifactDir, '09-player-walk-passing')
    await page.waitForTimeout(140)
    await shot(page, artifactDir, '10-player-walk-toeoff')
    await page.waitForTimeout(460)
    await page.keyboard.up('KeyW')
    await page.keyboard.press('KeyS')
    await page.waitForTimeout(350)

    await stage(page, { x: -9.15, y: 0.82, z: 2.15 })
    await shot(page, artifactDir, '11-stalker')
    await stage(page, { x: 2.4, y: 0.82, z: -4.1 })
    await shot(page, artifactDir, '12-brute')
    await stage(page, { x: 13, y: 0.82, z: -4 })
    await shot(page, artifactDir, '13-boss')
    await stage(page, { x: -1, y: 0.82, z: -4 })
    await shot(page, artifactDir, '14-lighting-overview')
    await stage(page, { x: -4.2, y: 0.82, z: -3.6 })
    await shot(page, artifactDir, '15-camera-safe-foreground')

    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForTimeout(450)
    await shot(page, artifactDir, '16-1280-gameplay')
    await page.setViewportSize(VIEWPORT)
    await stage(page, { x: -1, y: 0.82, z: -4 })
    dprOne = await sample(page)

    await boot(page, baseUrl, '?perfHud=1&m15Shadows=1')
    await stage(page, { x: -1, y: 0.82, z: -4 })
    shadowOn = await sample(page)

    const stats = dprOne?.renderer
    stats?.drawCalls <= 170 ? pass(`draw calls ${stats?.drawCalls}`) : fail(`draw calls ${stats?.drawCalls} > 170`)
    stats?.triangles <= 30_000 ? pass(`triangles ${stats?.triangles}`) : fail(`triangles ${stats?.triangles} > 30000`)
    stats?.pointLightCount <= 5
      ? pass(`point lights ${stats?.pointLightCount} (${stats?.lightCount} total)`)
      : fail(`point lights ${stats?.pointLightCount} > 5`)
    pageErrors.length === 0 ? pass('no page errors') : fail(pageErrors.join(' | '))
  },
})

await runOwnedBrowserGate({
  port: 4228,
  viewport: VIEWPORT,
  deviceScaleFactor: 1.5,
  run: async (page, { baseUrl }) => {
    await boot(page, baseUrl)
    await stage(page, { x: -1, y: 0.82, z: -4 })
    dprCapped = await sample(page)
  },
})

if (keep) {
  await writeFile(
    path.join(OUT, 'performance-ab.json'),
    `${JSON.stringify({ dprOne, shadowOn, dprCapped }, null, 2)}\n`,
  )
}
if (cleanupReport && !keep && cleanupReport.artifactCleanup?.kept) {
  fail('artifact dir kept without KEEP_ARTIFACTS')
}
if (failures.length > 0) {
  console.error(`FAIL: gate:m15-art-reset (${failures.length})`)
  process.exit(1)
}
console.log('PASS: gate:m15-art-reset')
