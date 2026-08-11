import { launchGateChromium } from './trackedGateBrowser.mjs'

const BASE = 'http://127.0.0.1:4173/'
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => { failures.push(message); console.error(`FAIL: ${message}`) }

async function gate(page, method, argument) {
  return page.evaluate(
    ({ method, argument }) => window.__MOURNEVEIL_GATE__[method](argument),
    { method, argument },
  )
}

async function snapshot(page) {
  return page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
}

const browser = await launchGateChromium({ headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.removeItem('mourneveil.save.v1')
  localStorage.removeItem('mourneveil.save.v2')
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(500)

await gate(page, 'setPlayerPosition', { x: -6, y: 0.82, z: 0 })
await gate(page, 'interactWorld')
let state = await snapshot(page)
state.checkpoint.activated ? pass('authored checkpoint activated') : fail('checkpoint activation')

await gate(page, 'defeatEnemy', 'enemy.skirmisher.introduction')
state = await snapshot(page)
state.echoes.carried === 25 ? pass('introduction reward granted once') : fail('introduction reward')

await gate(page, 'setPlayerPosition', { x: -2, y: 0.82, z: -1.2 })
await gate(page, 'interactWorld')
state = await snapshot(page)
state.world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed')
  ? pass('far-side shortcut opened')
  : fail('shortcut did not open')

await gate(page, 'applyDamage', 999)
await gate(page, 'respawn')
await page.waitForTimeout(100)
state = await snapshot(page)
state.playerHealth.lifeState === 'alive' ? pass('death and respawn remained stable') : fail('respawn')
state.world.openedShortcutIds.length === 1 ? pass('shortcut persisted through death') : fail('shortcut persistence')
state.enemies.every((enemy) => enemy.alive) ? pass('encounters reset') : fail('encounter reset')
state.echoes.carried === 0 && state.echoRecovery.amount === 25
  ? pass('encounter reset did not duplicate Echo reward')
  : fail('Echo reset policy')

await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(500)
state = await snapshot(page)
state.world.openedShortcutIds.length === 1 ? pass('shortcut restored from SaveFileV2') : fail('shortcut reload')
state.checkpoint.currentCheckpointId === 'checkpoint.m5.refuge' ? pass('checkpoint restored') : fail('checkpoint reload')

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) process.exit(1)
console.log('VERDICT: PASS')
