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
  ? pass('Development Details hidden')
  : fail('Development Details visible')

await gate(page, 'restorePlayer')
await page.screenshot({ path: 'tmp-m76-idle.png' })
pass('screenshot idle')

await gate(page, 'setMovementOverride', { horizontal: 0, forward: 1 })
await soak(page, 700)
await page.screenshot({ path: 'tmp-m76-locomotion.png' })
pass('screenshot locomotion')
await gate(page, 'setMovementOverride', null)

await gate(page, 'setPlayerPosition', { x: -10.2, y: 0.82, z: 2.4 })
await gate(page, 'requestAttack', { x: 0, z: -1 }, 'light')
await soak(page, 180)
await page.screenshot({ path: 'tmp-m76-light.png' })
pass('screenshot light attack')
await gate(page, 'advance', 40)

await gate(page, 'requestAttack', { x: 1, z: 0 }, 'heavy')
await soak(page, 220)
await page.screenshot({ path: 'tmp-m76-heavy.png' })
pass('screenshot heavy attack')
await gate(page, 'advance', 50)

// Guard via keyboard if available — soak near enemy
await gate(page, 'setPlayerPosition', { x: -10.5, y: 0.82, z: 2.2 })
await page.screenshot({ path: 'tmp-m76-guard-context.png' })
pass('screenshot combat context')

await gate(page, 'defeatEnemy', 'enemy.skirmisher.introduction')
await gate(page, 'setPlayerPosition', { x: -5.5, y: 0.82, z: 0 })
await gate(page, 'interactCheckpoint')
await soak(page, 200)
await page.screenshot({ path: 'tmp-m76-checkpoint.png' })
pass('screenshot checkpoint')

await gate(page, 'setPlayerPosition', { x: 1.5, y: 0.82, z: -4 })
await soak(page, 800)
await page.screenshot({ path: 'tmp-m76-mixed.png' })
pass('screenshot mixed')

await gate(page, 'defeatEnemy', 'enemy.skirmisher.1')
await gate(page, 'defeatEnemy', 'enemy.brute.1')
await soak(page, 200)

await gate(page, 'applyDamage', 999)
await soak(page, 200)
await page.screenshot({ path: 'tmp-m76-death.png' })
pass('screenshot death')
let state = await snapshot(page)
state.playerHealth.lifeState === 'dead' || !state.playerHealth.health.alive
  ? pass('death state active')
  : fail('death state missing')

await gate(page, 'respawn')
await soak(page, 400)
state = await snapshot(page)
state.playerHealth.health.alive ? pass('respawn alive') : fail('respawn failed')

// Collision still holds after animation work
await gate(page, 'setPlayerPosition', { x: -4.4, y: 0.82, z: -3.6 })
await gate(page, 'setMovementOverride', { horizontal: 1, forward: 0 })
await soak(page, 2200)
await gate(page, 'setMovementOverride', null)
state = await snapshot(page)
const clearance = Math.max(Math.abs(state.player.position.x + 3) - 0.25, 0)
clearance >= 0.29
  ? pass(`post-animation wall clearance=${clearance.toFixed(3)}`)
  : fail(`wall regression ${JSON.stringify(state.player.position)}`)

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('VERDICT: PASS')
