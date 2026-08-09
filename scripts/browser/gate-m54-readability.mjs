import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:4173/'
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.removeItem('mourneveil.save.v1')
  localStorage.removeItem('mourneveil.save.v2')
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(800)

const milestone = await page.locator('.development-panel').innerText()
milestone.includes('M5 Connected Level') && milestone.includes('M5.4')
  ? pass('centralized milestone visible in compact panel')
  : fail(`milestone text: ${milestone.slice(0, 120)}`)

const panelBox = await page.locator('.development-panel').boundingBox()
panelBox && panelBox.width <= 300
  ? pass(`dev panel width bounded (${Math.round(panelBox.width)}px)`)
  : fail(`dev panel too wide: ${panelBox?.width}`)

await page.getByRole('button', { name: 'Details' }).click()
await page.getByRole('button', { name: 'Collapse' }).click()
pass('dev panel expands and collapses')

const inventory = await page.locator('.inventory-panel').innerText()
!inventory.includes('item.weapon.oathblade')
  ? pass('inventory does not expose raw weapon id by default')
  : fail('raw weapon id visible before loot')

const invBox = await page.locator('.inventory-panel').boundingBox()
invBox && invBox.width <= 280
  ? pass(`inventory width bounded (${Math.round(invBox.width)}px)`)
  : fail(`inventory too wide: ${invBox?.width}`)

const overflowX = await page.evaluate(() => {
  const panel = document.querySelector('.development-panel')
  const inventoryPanel = document.querySelector('.inventory-panel')
  return {
    dev: panel ? panel.scrollWidth > panel.clientWidth + 1 : true,
    inv: inventoryPanel
      ? inventoryPanel.scrollWidth > inventoryPanel.clientWidth + 1
      : true,
  }
})
!overflowX.dev && !overflowX.inv
  ? pass('no horizontal overflow on diagnostic panels')
  : fail(`horizontal overflow dev=${overflowX.dev} inv=${overflowX.inv}`)

await page.evaluate(() => window.__MOURNEVEIL_GATE__.setPlayerPosition({ x: -6, y: 0.82, z: 0 }))
await page.waitForTimeout(200)
const state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
state.checkpoint ? pass('checkpoint still present for refuge readability') : fail('checkpoint missing')

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  process.exit(1)
}
console.log('VERDICT: PASS')
