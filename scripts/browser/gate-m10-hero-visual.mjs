import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m10-hero-visual'
const PORT = 4197
const baselineOnly = process.argv.includes('--baseline')
const PRODUCTION_VISUAL_BUDGET = Object.freeze({
  drawCalls: 280,
  triangles: 75_000,
  geometries: 150,
  textures: 16,
  programs: 12,
  sceneObjectCount: 400,
  meshCount: 240,
  lightCount: 9,
  jsHeapUsedBytes: 160_000_000,
})
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function settle(page, milliseconds = 900) {
  const slices = Math.ceil(milliseconds / 40)
  for (let index = 0; index < slices; index += 1) await page.waitForTimeout(40)
}

async function capture(page, name, settleMilliseconds = 900) {
  await settle(page, settleMilliseconds)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
}

async function holdGuard(page) {
  const canvas = page.locator('canvas')
  const bounds = await canvas.boundingBox()
  if (bounds === null) throw new Error('gameplay canvas has no bounds')
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down({ button: 'right' })
}

async function waitForGuardBreak(page) {
  const deadline = Date.now() + 12_000
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    if (state.incomingContact.lastHit?.outcome === 'guard-broken') return state
    await page.waitForTimeout(40)
  }
  throw new Error('guard break not observed in hero fixture')
}

let cleanupReport = null
await runOwnedBrowserGate({
  port: PORT,
  artifactDir: OUT,
  viewport: { width: 1440, height: 900 },
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl }) => {
    const pageErrors = []
    const assetErrors = []
    page.on('pageerror', (error) => pageErrors.push(String(error)))
    page.on('console', (message) => {
      const text = message.text()
      if (/failed to load|GLTFLoader|404.*assets/i.test(text)) assetErrors.push(text)
    })

    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await page.evaluate(() => {
      const gate = window.__MOURNEVEIL_GATE__
      gate.resetMeleeFixture()
      gate.restorePlayer()
      gate.setPlayerPosition({ x: -5.2, y: 0.82, z: 0.4 })
      gate.setPlayerFacing({ x: 0.3, z: -0.95 })
    })
    let baseline = null
    for (let attempt = 0; attempt < 60; attempt += 1) {
      baseline = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
      if (baseline !== null) break
      await settle(page, 100)
    }
    if (baseline === null) fail('renderer metrics unavailable')
    else {
      console.log('M10 HERO METRICS:', JSON.stringify(baseline, null, 2))
      pass(`hero metrics captured drawCalls=${baseline.drawCalls} triangles=${baseline.triangles}`)
      const exceeded = Object.entries(PRODUCTION_VISUAL_BUDGET)
        .filter(([metric, limit]) => baseline[metric] !== null && baseline[metric] > limit)
        .map(([metric, limit]) => `${metric}=${baseline[metric]}>${limit}`)
      exceeded.length === 0
        ? pass('production visual budgets satisfied')
        : fail(`production visual budgets exceeded: ${exceeded.join(', ')}`)
    }
    await capture(page, '01-hero-checkpoint')

    if (!baselineOnly) {
      await page.reload({ waitUntil: 'load' })
      await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
        timeout: 30_000,
      })
      await settle(page, 1_000)
      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        const intro = gate
          .snapshot()
          .enemies.find((entry) => entry.id === 'enemy.skirmisher.introduction')
        if (intro === undefined) throw new Error('introduction skirmisher missing')
        gate.setPlayerPosition({
          x: intro.position.x + 0.8,
          y: 0.82,
          z: intro.position.z - 1.1,
        })
        gate.setPlayerFacing({ x: -0.59, z: 0.81 })
        gate.advance(2)
      })
      await capture(page, '02-player-skirmisher')

      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        const intro = gate
          .snapshot()
          .enemies.find((entry) => entry.id === 'enemy.skirmisher.introduction')
        if (intro === undefined) throw new Error('introduction skirmisher missing')
        gate.setPlayerPosition({
          x: intro.position.x,
          y: 0.82,
          z: intro.position.z - 0.78,
        })
        gate.setPlayerFacing({ x: 0, z: 1 })
        gate.requestAttack({ x: 0, z: 1 }, 'heavy')
        while (gate.snapshot().combat.phase !== 'active') gate.advance(1)
        gate.advance(1)
      })
      await capture(page, '03-heavy-impact', 80)

      await page.reload({ waitUntil: 'load' })
      await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
        timeout: 30_000,
      })
      await settle(page, 1_000)
      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        gate.resetMeleeFixture()
      })
      await holdGuard(page)
      await page.waitForFunction(() => window.__MOURNEVEIL_GATE__.snapshot().defense.guarding)
      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        for (const enemy of gate.snapshot().enemies) {
          if (enemy.id !== 'enemy.skirmisher.introduction') gate.defeatEnemy(enemy.id)
        }
        gate.setPlayerPosition({ x: -9.05, y: 0.82, z: 3.1 })
        gate.setPlayerFacing({ x: -1, z: 0 })
      })
      await waitForGuardBreak(page)
      await capture(page, '04-guard-break', 60)
      await page.mouse.up({ button: 'right' })
    }

    assetErrors.length === 0 ? pass('no runtime asset errors') : fail(assetErrors.join(' | '))
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
} else {
  pass(`browser/server closed; port ${PORT} reusable`)
  pass(cleanupReport.artifactCleanup?.kept ? `review artifacts kept at ${OUT}` : 'artifacts cleaned')
}

if (failures.length > 0) throw new Error(failures.join('\n'))
console.log(`\nM10 hero visual gate PASS${baselineOnly ? ' (baseline)' : ''}`)
