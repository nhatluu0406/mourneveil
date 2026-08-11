import { launchGateChromium } from './trackedGateBrowser.mjs'

const BASE = 'http://127.0.0.1:4173/'
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

const browser = await launchGateChromium({ headless: true })
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

;(await page.locator('.development-panel').count()) === 0
  ? pass('Development Details hidden by default')
  : fail('Development Details visible by default')

await page.keyboard.press('F3')
await page.waitForTimeout(100)
const milestone = await page.locator('.development-panel').innerText()
milestone.includes('M6') || milestone.includes('WORKING TITLE') || milestone.includes('Development')
  ? pass('centralized milestone visible after F3')
  : fail(`milestone text: ${milestone.slice(0, 120)}`)

const panelBox = await page.locator('.development-panel').boundingBox()
panelBox && panelBox.width <= 360
  ? pass(`dev panel width bounded (${Math.round(panelBox.width)}px)`)
  : fail(`dev panel too wide: ${panelBox?.width}`)

await page.keyboard.press('F3')
await page.waitForTimeout(80)
;(await page.locator('.development-panel').count()) === 0
  ? pass('F3 hides Development Details')
  : fail('F3 did not hide Development Details')

await page.keyboard.press('KeyI')
await page.waitForTimeout(120)
const inventory = await page.locator('.inventory-panel').innerText()
!inventory.includes('item.weapon.oathblade')
  ? pass('inventory does not expose raw weapon id by default')
  : fail('raw weapon id visible before loot')

const invBox = await page.locator('.inventory-panel').boundingBox()
invBox && invBox.width <= 420
  ? pass(`inventory width bounded (${Math.round(invBox.width)}px)`)
  : fail(`inventory too wide: ${invBox?.width}`)

const overflowX = await page.evaluate(() => {
  const inventoryPanel = document.querySelector('.inventory-panel')
  return {
    inventoryScroll: inventoryPanel ? inventoryPanel.scrollWidth > inventoryPanel.clientWidth + 2 : false,
    bodyScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }
})
!overflowX.inventoryScroll && !overflowX.bodyScroll
  ? pass('no horizontal overflow on inventory/body')
  : fail(`horizontal overflow ${JSON.stringify(overflowX)}`)

await page.keyboard.press('KeyI')

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('VERDICT: PASS')
