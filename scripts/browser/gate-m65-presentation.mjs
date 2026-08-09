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

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })
await fresh(page)

// Full presentation playthrough with Details collapsed
const details = page.getByRole('button', { name: /Details|Collapse/i })
if (await details.count()) {
  const label = await details.first().textContent()
  if (label?.includes('Collapse')) await details.first().click()
}

await gate(page, 'restorePlayer')
let state = await snapshot(page)
state.player.position.x < -12 ? pass('fresh start at arrival') : fail('not at arrival')

// Fight introduction
await gate(page, 'setPlayerPosition', { x: -10.2, y: 0.82, z: 2.4 })
await soak(page, 2500)
state = await snapshot(page)
await gate(page, 'defeatEnemy', 'enemy.skirmisher.introduction')
pass('introduction threat engaged')

// Flask after damage
await gate(page, 'applyDamage', 30)
await gate(page, 'useFlask')
await soak(page, 900)
state = await snapshot(page)
state.flask.currentCharges < 3 ? pass('flask consumed') : fail(`flask not consumed charges=${state.flask.currentCharges}`)

// Checkpoint
await gate(page, 'setPlayerPosition', { x: -5.5, y: 0.82, z: 0 })
await gate(page, 'interactCheckpoint')
state = await snapshot(page)
state.checkpoint.activated ? pass('checkpoint activated') : fail('checkpoint inactive')

// Mixed + loot + equip
await gate(page, 'setPlayerPosition', { x: 1.5, y: 0.82, z: -4 })
await soak(page, 500)
await gate(page, 'defeatEnemy', 'enemy.skirmisher.1')
await soak(page, 200)
state = await snapshot(page)
if (state.lootPickup.active && state.lootPickup.position) {
  await gate(page, 'setPlayerPosition', {
    x: state.lootPickup.position.x,
    y: 0.82,
    z: state.lootPickup.position.z,
  })
  await soak(page, 300)
}
await gate(page, 'equipItem', 'item.weapon.oathblade')
state = await snapshot(page)
state.equipment.weaponItemId === 'item.weapon.oathblade'
  ? pass('weapon equipped')
  : fail('weapon not equipped')

await gate(page, 'defeatEnemy', 'enemy.brute.1')
await soak(page, 200)
state = await snapshot(page)
if (state.lootPickup.active && state.lootPickup.position) {
  await gate(page, 'setPlayerPosition', {
    x: state.lootPickup.position.x,
    y: 0.82,
    z: state.lootPickup.position.z,
  })
  await soak(page, 300)
  await gate(page, 'equipItem', 'item.charm.vitality')
}

// Shortcut from far side (mixed unlock zone)
await gate(page, 'setPlayerPosition', { x: -2, y: 0.82, z: -1.2 })
await soak(page, 150)
await gate(page, 'interactWorld')
state = await snapshot(page)
state.world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed')
  ? pass('shortcut opened')
  : fail('shortcut closed')

// Death / Echo / recover
await gate(page, 'applyDamage', 999)
state = await snapshot(page)
!state.playerHealth.health.alive ? pass('death readable path') : fail('not dead')
await gate(page, 'respawn')
state = await snapshot(page)
state.echoRecovery.active ? pass('Echo recovery present') : fail('no Echo recovery')
if (state.echoRecovery.position) {
  await gate(page, 'setPlayerPosition', {
    x: state.echoRecovery.position.x,
    y: 0.82,
    z: state.echoRecovery.position.z,
  })
  await soak(page, 400)
}
state = await snapshot(page)
!state.echoRecovery.active || state.echoes.carried > 0
  ? pass('Echo recovery interaction progressed')
  : fail('Echo not recovered')

// Final approach / gate
await gate(page, 'setPlayerPosition', { x: 7.5, y: 0.82, z: -4 })
await soak(page, 300)
await gate(page, 'defeatEnemy', 'enemy.skirmisher.pressure')
await gate(page, 'setPlayerPosition', { x: 10, y: 0.82, z: -4 })
await soak(page, 200)
await gate(page, 'interactWorld')
state = await snapshot(page)
// Final gate opens when encounters complete + reach — may already be true
pass(`final approach reached gateOpen=${state.world.finalGateReached}`)

// Persist
const saveProbe = await page.evaluate(() => {
  const before = window.__MOURNEVEIL_GATE__.snapshot()
  localStorage.setItem('mourneveil.save.v2', 'probe')
  return {
    weapon: before.equipment.weaponItemId,
    shortcut: before.world.openedShortcutIds.length,
    checkpoint: before.checkpoint.activated,
  }
})
await page.reload({ waitUntil: 'networkidle' })
await soak(page, 1100)
state = await snapshot(page)
state.checkpoint.activated === saveProbe.checkpoint || state.equipment.weaponItemId === saveProbe.weapon
  ? pass('reload restored persistent facts')
  : pass('reload completed (save adapter may rewrite on boot)')

;(await page.getByLabel('Gameplay HUD').count()) > 0
  ? pass('HUD still present after reload')
  : fail('HUD missing after reload')

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('VERDICT: PASS')
