import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:4174/'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const result = await page.evaluate(() => ({
  hasGate: typeof window.__MOURNEVEIL_GATE__ !== 'undefined',
  hasHud: !!document.querySelector('[aria-label="Gameplay HUD"]'),
  hasDetails: !!document.querySelector('[aria-label="Development diagnostic"]'),
  hasInventory: !!document.querySelector('[aria-label="Inventory and equipment"]'),
}))
console.log(JSON.stringify({ ...result, errors }, null, 2))
await browser.close()
if (result.hasGate || result.hasDetails || !result.hasHud || !result.hasInventory || errors.length > 0) {
  console.error('PRODUCTION BOUNDARY: FAIL')
  process.exit(1)
}
console.log('PRODUCTION BOUNDARY: PASS')
