import { launchGateChromium } from './trackedGateBrowser.mjs'

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
  await soak(page, 1100)
}

async function gate(page, method, ...args) {
  return page.evaluate(
    ({ method, args }) => window.__MOURNEVEIL_GATE__[method](...args),
    { method, args },
  )
}

async function snapshot(page) {
  return page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
}

const browser = await launchGateChromium({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })
await fresh(page)

;(await page.locator('.development-panel').count()) === 0
  ? pass('play starts without Development Details')
  : fail('Development Details visible at start')

const checkpoints = [
  ['arrival', { x: -14, y: 0.82, z: 6 }],
  ['first-combat', { x: -10.2, y: 0.82, z: 2.5 }],
  ['checkpoint', { x: -5.5, y: 0.82, z: 0 }],
  ['mixed', { x: 1.5, y: 0.82, z: -4 }],
  ['shortcut', { x: -2.2, y: 0.82, z: -1.2 }],
  ['final-approach', { x: 7.5, y: 0.82, z: -4 }],
  ['final-arena', { x: 13, y: 0.82, z: -4 }],
]

for (const [name, position] of checkpoints) {
  await gate(page, 'restorePlayer')
  await gate(page, 'setPlayerPosition', position)
  await soak(page, 250)
  const shot = `tmp-m610-${name}.png`
  await page.screenshot({ path: shot, fullPage: false })
  pass(`screenshot ${name} -> ${shot}`)
}

await page.keyboard.press('KeyI')
await soak(page, 150)
await page.screenshot({ path: 'tmp-m610-inventory.png', fullPage: false })
pass('screenshot inventory open')
await page.keyboard.press('KeyI')

await gate(page, 'applyDamage', 35)
await soak(page, 120)
await page.screenshot({ path: 'tmp-m610-damaged.png', fullPage: false })
pass('screenshot damaged')

await gate(page, 'defeatEnemy', 'enemy.skirmisher.introduction')
await gate(page, 'setPlayerPosition', { x: -5.5, y: 0.82, z: 0 })
await gate(page, 'interactCheckpoint')
await gate(page, 'applyDamage', 999)
await gate(page, 'respawn')
await soak(page, 300)
await page.screenshot({ path: 'tmp-m610-respawn.png', fullPage: false })
pass('screenshot death/respawn')

let state = await snapshot(page)
state.playerHealth.health.alive ? pass('alive after respawn') : fail('dead after respawn')
;(await page.getByLabel('Gameplay HUD').count()) > 0 ? pass('HUD remains') : fail('HUD missing')

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('VERDICT: PASS')
