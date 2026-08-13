import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { runOwnedBrowserGate, shouldKeepGateArtifacts } from './runtimeGateLifecycle.mjs'
import { CANONICAL_SAVE_KEYS, withFreshQuery } from './freshSession.mjs'
import { M15_VIEWPORT, soak } from './m15MotionScenario.mjs'

const OUT = 'tmp-m15-integrity'
const PORT = 4225
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
    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await page.evaluate((keys) => {
      for (const key of keys) localStorage.removeItem(key)
    }, CANONICAL_SAVE_KEYS)

    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.waitForSelector('[data-title-action="begin-rite"]', { timeout: 15_000 })
    if (await page.locator('canvas').count()) fail('runtime canvas mounted before Begin Rite')
    await page.click('[data-title-action="begin-rite"]')
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await soak(page, 700)
    const freshBoss = await page.evaluate(() => {
      const snap = window.__MOURNEVEIL_GATE__.snapshot()
      return {
        alive: snap.enemies.find((enemy) => enemy.id === 'enemy.boss.sepulchre.1')?.alive,
        defeated: snap.world.defeatedBossIds,
      }
    })
    if (freshBoss.alive !== true || freshBoss.defeated.length !== 0) {
      fail(`fresh rite boss not living: ${JSON.stringify(freshBoss)}`)
    } else pass('Begin Rite starts a living boss')
    await shot(page, artifactDir, '01-new-game-fresh')

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: 13, y: 0.82, z: -3 })
      g.advance(8)
      g.defeatEnemy('enemy.boss.sepulchre.1')
      g.advance(8)
    })
    await soak(page, 400)

    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.waitForSelector('[data-title-action="continue"]', { timeout: 15_000 })
    await page.click('[data-title-action="continue"]')
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await soak(page, 800)
    const continued = await page.evaluate(() => {
      const snap = window.__MOURNEVEIL_GATE__.snapshot()
      return {
        alive: snap.enemies.find((enemy) => enemy.id === 'enemy.boss.sepulchre.1')?.alive,
        defeated: snap.world.defeatedBossIds,
        complete: snap.world.defeatedBossIds.includes('boss.veilbound-sepulchre'),
      }
    })
    if (continued.alive !== false || continued.complete !== true) {
      fail(`Continue did not persist defeat: ${JSON.stringify(continued)}`)
    } else pass('Continue keeps defeated boss and Rite Complete')
    await shot(page, artifactDir, '02-continue-complete')

    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.waitForSelector('[data-title-action="new-rite"]', { timeout: 15_000 })
    await page.click('[data-title-action="new-rite"]')
    await page.waitForSelector('[data-title-confirm="1"]', { timeout: 8_000 })
    await page.click('[data-title-confirm-yes]')
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await soak(page, 700)
    const reset = await page.evaluate(() => {
      const snap = window.__MOURNEVEIL_GATE__.snapshot()
      return {
        alive: snap.enemies.find((enemy) => enemy.id === 'enemy.boss.sepulchre.1')?.alive,
        defeated: snap.world.defeatedBossIds,
      }
    })
    if (reset.alive !== true || reset.defeated.length !== 0) {
      fail(`New Rite did not reset boss: ${JSON.stringify(reset)}`)
    } else pass('New Rite restores a living boss')
    await shot(page, artifactDir, '03-new-rite-reset')

    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    pass('?fresh=1 skips title')
    if (pageErrors.length > 0) fail(`page errors: ${pageErrors.join(' | ')}`)
  },
})

if (!cleanupReport?.browserClosed || !cleanupReport?.serverExited) {
  fail(`cleanup incomplete: ${JSON.stringify(cleanupReport)}`)
}
if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} session-flow checks`)
  process.exit(1)
}
console.log('OK: gate:m15-session-flow')
