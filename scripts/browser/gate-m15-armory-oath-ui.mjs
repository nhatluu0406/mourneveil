import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { runOwnedBrowserGate, shouldKeepGateArtifacts } from './runtimeGateLifecycle.mjs'
import { withFreshQuery } from './freshSession.mjs'
import { M15_VIEWPORT, soak } from './m15MotionScenario.mjs'

const OUT = 'tmp-m15-integrity'
const PORT = 4226
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
    await soak(page, 600)
    await page.locator('canvas').click({ position: { x: 720, y: 450 } })
    await page.keyboard.press('KeyI')
    await page.waitForSelector('[data-panel-mode="armory"]', { timeout: 8_000 })
    const armoryHasOath = await page.locator('[data-oath-view]').count()
    if (armoryHasOath > 0) fail('Armory default also shows Oath view')
    else pass('I opens Armory only')
    await shot(page, artifactDir, '10-armory')

    const desktopScroll = await page.evaluate(() => ({
      page: document.documentElement.scrollHeight > window.innerHeight + 1,
      owned: document.querySelectorAll('[data-scrollbar-policy="owned"]').length,
    }))
    if (desktopScroll.page) fail('1440×900 has a page scrollbar')
    else pass('1440×900 has no page scrollbar')

    await page.click('[data-panel-tab="oath"]')
    await page.waitForSelector('[data-panel-mode="oath"]', { timeout: 8_000 })
    const oathHasItems = await page.locator('[data-oath-view] [data-inventory-scroll]').count()
    if (oathHasItems > 0) fail('Oath still lists inventory')
    else pass('Oath hides item inventory')
    await shot(page, artifactDir, '11-oath')

    await page.click('[data-panel-tab="armory"]')
    await page.setViewportSize({ width: 1280, height: 720 })
    await soak(page, 300)
    await shot(page, artifactDir, '12-armory-1280')
    const compact = await page.evaluate(() => {
      const owned = [...document.querySelectorAll('[data-scrollbar-policy="owned"]')]
      const scrolling = owned.filter((node) => node.scrollHeight > node.clientHeight + 1)
      return {
        page: document.documentElement.scrollHeight > window.innerHeight + 1,
        ownedCount: owned.length,
        scrollingCount: scrolling.length,
      }
    })
    if (compact.page) fail('1280×720 still has a page scrollbar')
    if (compact.ownedCount !== 1) fail(`expected one owned scroll region, got ${compact.ownedCount}`)
    else pass(`1280×720 owned scroll regions=${compact.ownedCount}`)
    if (pageErrors.length > 0) fail(`page errors: ${pageErrors.join(' | ')}`)
  },
})

if (!cleanupReport?.browserClosed || !cleanupReport?.serverExited) {
  fail(`cleanup incomplete: ${JSON.stringify(cleanupReport)}`)
}
if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} armory-oath checks`)
  process.exit(1)
}
console.log('OK: gate:m15-armory-oath-ui')
