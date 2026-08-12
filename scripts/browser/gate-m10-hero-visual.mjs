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

async function assertProductHud(page) {
  const state = await page.evaluate(() => {
    const hud = document.querySelector('[data-product-hud="1"]')
    const hint = document.querySelector('.dev-hint')
    const panel = document.querySelector('.development-panel')
    return {
      hudPresent: hud !== null,
      healthText: document.querySelector('.gameplay-hud__hp-text')?.textContent ?? null,
      flaskCount: document.querySelectorAll('.gameplay-hud__flask').length,
      commands: document.querySelectorAll('.gameplay-hud__command').length,
      devHintVisible: hint !== null && getComputedStyle(hint).display !== 'none',
      developmentPanelOpen: panel !== null && !panel.hasAttribute('hidden') && getComputedStyle(panel).display !== 'none',
    }
  })
  state.hudPresent ? pass('product HUD mounted') : fail('product HUD missing')
  state.healthText && /\d+\/\d+/.test(state.healthText)
    ? pass(`HUD health bound (${state.healthText})`)
    : fail(`HUD health unbound: ${state.healthText}`)
  state.flaskCount > 0 ? pass(`HUD flasks present (${state.flaskCount})`) : fail('HUD flasks missing')
  state.commands === 6 ? pass('HUD action dock present') : fail(`HUD action dock count=${state.commands}`)
  !state.devHintVisible ? pass('dev hint absent from product presentation') : fail('dev hint visible on product screen')
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
    await assertProductHud(page)
    await capture(page, '01-refuge-wide')

    if (!baselineOnly) {
      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        gate.setPlayerPosition({ x: -6.15, y: 0.82, z: -0.2 })
        gate.setPlayerFacing({ x: 0.5, z: 0.86 })
      })
      await capture(page, '02-refuge-actor-close')

      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        gate.setPlayerPosition({ x: -7.9, y: 0.82, z: 1.65 })
        gate.setPlayerFacing({ x: -0.55, z: 0.84 })
      })
      await capture(page, '03-corridor-composition')

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
        gate.setPlayerPosition({ x: -9.15, y: 0.82, z: 2.15 })
        gate.setPlayerFacing({ x: -0.74, z: 0.67 })
        gate.advance(2)
      })
      await capture(page, '04-first-combat-composition')

      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        gate.resetMeleeFixture()
        for (const enemy of gate.snapshot().enemies) {
          if (enemy.id !== 'enemy.skirmisher.introduction') gate.defeatEnemy(enemy.id)
        }
        gate.setPlayerPosition({ x: -9.05, y: 0.82, z: 3.1 })
        gate.setPlayerFacing({ x: -1, z: 0 })
      })
      await settle(page, 550)
      const telegraph = await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        gate.resetMeleeFixture()
        for (const enemy of gate.snapshot().enemies) {
          if (enemy.id !== 'enemy.skirmisher.introduction') gate.defeatEnemy(enemy.id)
        }
        gate.setPlayerPosition({ x: -9.05, y: 0.82, z: 3.1 })
        gate.setPlayerFacing({ x: -1, z: 0 })
        for (let step = 0; step < 420; step += 1) {
          gate.advance(1)
          const intro = gate.snapshot().enemies.find((enemy) => enemy.id === 'enemy.skirmisher.introduction')
          if (intro?.action.phase === 'startup') return intro.action.phase
        }
        return null
      })
      telegraph === 'startup' ? pass('deterministic skirmisher telegraph framed') : fail('skirmisher startup not reached')
      await capture(page, '05-combat-telegraph', 45)

      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        gate.resetMeleeFixture()
        gate.restorePlayer()
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
      await capture(page, '06-hit-interrupt-cue', 80)

      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        gate.resetMeleeFixture()
        gate.restorePlayer()
        for (const enemy of gate.snapshot().enemies) {
          if (enemy.id !== 'enemy.skirmisher.introduction') gate.defeatEnemy(enemy.id)
        }
        const intro = gate.snapshot().enemies.find((entry) => entry.id === 'enemy.skirmisher.introduction')
        if (intro === undefined) throw new Error('introduction skirmisher missing')
        gate.setPlayerPosition({
          x: intro.position.x,
          y: 0.82,
          z: intro.position.z - 0.85,
        })
        gate.setPlayerFacing({ x: 0, z: 1 })
      })
      {
        const canvas = page.locator('canvas')
        await canvas.waitFor({ state: 'visible' })
        const bounds = await canvas.boundingBox()
        if (bounds === null) throw new Error('Gameplay canvas has no bounds')
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
        await page.mouse.down({ button: 'right' })
        const broken = await page.waitForFunction(
          () => window.__MOURNEVEIL_GATE__.snapshot().defense.guardBroken === true,
          null,
          { timeout: 18_000 },
        ).then(() => true).catch(() => false)
        broken ? pass('guard-break cue framed') : fail('guard-break not reached')
        await capture(page, '07-guard-break', 60)
        await page.mouse.up({ button: 'right' })
      }

      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        gate.resetMeleeFixture()
        gate.restorePlayer()
        gate.setPlayerPosition({ x: -9.45, y: 0.82, z: 1.55 })
        gate.setPlayerFacing({ x: -0.88, z: -0.48 })
      })
      await capture(page, '08-progression-landmark')

      await page.evaluate(() => {
        const gate = window.__MOURNEVEIL_GATE__
        gate.setPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
        gate.setPlayerFacing({ x: 0, z: 1 })
      })
      await capture(page, '09-product-ui')

      await page.keyboard.press('KeyI')
      await settle(page, 400)
      const inventoryOpen = await page.evaluate(
        () => document.querySelector('.inventory-overlay, .inventory-panel') !== null,
      )
      inventoryOpen ? pass('inventory panel opened') : fail('inventory panel missing after I')
      await capture(page, '10-inventory-open')
      await page.keyboard.press('KeyI')
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
