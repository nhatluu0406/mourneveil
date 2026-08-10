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

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })
await fresh(page)

;(await page.locator('.development-panel').count()) === 0
  ? pass('Development Details hidden by default')
  : fail('Development Details visible by default')

const hud = page.getByLabel('Gameplay HUD')
;(await hud.count()) > 0 ? pass('gameplay HUD present') : fail('gameplay HUD missing')
;(await page.getByLabel('Health').count()) > 0 ? pass('health meter present') : fail('health meter missing')
;(await page.getByLabel('Flask charges').count()) > 0 ? pass('flask charges present') : fail('flask missing')
;(await page.getByLabel('Echoes').count()) > 0 ? pass('Echoes present') : fail('Echoes missing')
;(await page.getByLabel('Controls').count()) > 0 ? pass('command strip present') : fail('command strip missing')

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
const hpText = await page.locator('.gameplay-hud__hp-text').textContent()
hpText?.startsWith('60/') || hpText?.startsWith('6')
  ? pass(`HUD HP reflects damage (${hpText})`)
  : fail(`HUD HP not updated (${hpText})`)

await page.keyboard.press('KeyI')
await soak(page, 120)
;(await page.getByLabel('Inventory and equipment').count()) > 0
  ? pass('I opens inventory overlay')
  : fail('I did not open inventory')
await page.getByRole('button', { name: /Close/i }).click()
await soak(page, 100)
;(await page.getByLabel('Inventory and equipment').count()) === 0
  ? pass('inventory closes')
  : fail('inventory stayed open')

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('VERDICT: PASS')
