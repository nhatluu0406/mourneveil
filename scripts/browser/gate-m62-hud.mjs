import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:4173/'
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function soak(page, ms) {
  const slice = 40
  for (let i = 0; i < Math.ceil(ms / slice); i += 1) await page.waitForTimeout(slice)
}

async function fresh(page) {
  await page.evaluate(() => {
    localStorage.removeItem('mourneveil.save.v1')
    localStorage.removeItem('mourneveil.save.v2')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await soak(page, 1000)
}

async function snapshot(page) {
  return page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })
await fresh(page)

// Details collapsed by default
const detailsOpen = await page.locator('.development-panel__details').count()
detailsOpen === 0 ? pass('Details collapsed by default') : fail('Details expanded by default')

const hud = page.getByLabel('Gameplay HUD')
;(await hud.count()) > 0 ? pass('gameplay HUD present') : fail('gameplay HUD missing')
;(await page.getByLabel('Health').count()) > 0 ? pass('health meter present') : fail('health meter missing')
;(await page.getByLabel('Flask charges').count()) > 0 ? pass('flask charges present') : fail('flask missing')
;(await page.getByLabel('Echoes').count()) > 0 ? pass('Echoes present') : fail('Echoes missing')

await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.setPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
})
await soak(page, 300)
;(await page.getByText('F — Rest').count()) > 0
  ? pass('Rest prompt visible at checkpoint')
  : fail('Rest prompt missing')

await page.evaluate(() => window.__MOURNEVEIL_GATE__.applyDamage(40))
await soak(page, 100)
const hpText = await page.locator('.gameplay-hud__bar-label').textContent()
hpText?.startsWith('60/') || hpText?.startsWith('6')
  ? pass(`HUD HP reflects damage (${hpText})`)
  : fail(`HUD HP not updated (${hpText})`)

// Inventory clicks must not throw / should isolate from gameplay
await page.getByRole('button', { name: 'Show' }).click()
await soak(page, 100)
;(await page.getByText('Equipped').count()) > 0 ? pass('inventory expands') : fail('inventory did not expand')
await page.getByRole('button', { name: 'Hide' }).click()

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('VERDICT: PASS')
