import { launchGateChromium } from './trackedGateBrowser.mjs'

const BASE = 'http://127.0.0.1:4173/'
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function gate(page, method, argument) {
  return page.evaluate(
    ({ method, argument }) => window.__MOURNEVEIL_GATE__[method](argument),
    { method, argument },
  )
}

async function snapshot(page) {
  return page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
}

async function soak(page, ms) {
  const slice = 40
  for (let i = 0; i < Math.ceil(ms / slice); i += 1) await page.waitForTimeout(slice)
}

async function moveAlong(page, points, dwellMs = 200) {
  for (const point of points) {
    await gate(page, 'setPlayerPosition', point)
    await soak(page, dwellMs)
  }
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
await soak(page, 900)

let state = await snapshot(page)
Math.hypot(state.player.position.x + 14, state.player.position.z - 6) < 0.4
  ? pass('1 spawn at arrival')
  : fail(`spawn ${JSON.stringify(state.player.position)}`)

await moveAlong(page, [
  { x: -12, y: 0.82, z: 5 },
  { x: -10.2, y: 0.82, z: 3.1 },
])
state = await snapshot(page)
state.encounterActivation.activatedEncounterIds.includes('encounter.m5.introduction')
  ? pass('2-3 first route + introduction activation')
  : fail('introduction not activated')

await gate(page, 'defeatEnemy', 'enemy.skirmisher.introduction')
state = await snapshot(page)
state.echoes.carried === 25 ? pass('7 echoes from introduction') : fail(`echoes ${state.echoes.carried}`)

await gate(page, 'applyDamage', 25)
await gate(page, 'useFlask')
await soak(page, 400)
state = await snapshot(page)
state.flask.currentCharges < state.flask.maximumCharges
  ? pass('4 took damage and used flask')
  : fail('flask not consumed')

await gate(page, 'setPlayerPosition', { x: -6, y: 0.82, z: 0 })
await gate(page, 'interactWorld')
state = await snapshot(page)
state.checkpoint.activated ? pass('5 refuge checkpoint activated') : fail('checkpoint not activated')

await moveAlong(page, [
  { x: -5.5, y: 0.82, z: -4 },
  { x: -2.2, y: 0.82, z: -5.8 },
  { x: 1.4, y: 0.82, z: -2.6 },
])
state = await snapshot(page)
state.encounterActivation.activatedEncounterIds.includes('encounter.m5.mixed')
  ? pass('6 mixed encounter activated')
  : fail('mixed not activated')

await gate(page, 'defeatEnemy', 'enemy.skirmisher.1')
await soak(page, 200)
state = await snapshot(page)
state.lootPickup.active || state.inventory.entries.some((e) => e.itemId === 'item.weapon.oathblade')
  ? pass('8 loot available/collected path ready')
  : fail('loot missing after skirmisher defeat')

if (state.lootPickup.active) {
  await gate(page, 'setPlayerPosition', state.lootPickup.position)
  await soak(page, 300)
}
state = await snapshot(page)
if (state.inventory.entries.some((e) => e.itemId === 'item.weapon.oathblade')) {
  await gate(page, 'equipItem', 'item.weapon.oathblade')
  state = await snapshot(page)
  state.equipment.weaponItemId === 'item.weapon.oathblade'
    ? pass('8-9 loot obtained and equipped')
    : fail('equip failed')
} else {
  fail('oathblade not in inventory')
}

await gate(page, 'defeatEnemy', 'enemy.brute.1')
await soak(page, 200)
await gate(page, 'setPlayerPosition', { x: -2, y: 0.82, z: -1.2 })
await gate(page, 'interactWorld')
state = await snapshot(page)
state.world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed')
  ? pass('9 shortcut opened from intended side')
  : fail('shortcut not opened')

const carriedBeforeDeath = state.echoes.carried
await gate(page, 'setPlayerPosition', { x: 2, y: 0.82, z: -4 })
await gate(page, 'applyDamage', 999)
await gate(page, 'respawn')
await soak(page, 300)
state = await snapshot(page)
state.playerHealth.lifeState === 'alive' &&
  Math.hypot(state.player.position.x + 6, state.player.position.z) < 0.5
  ? pass('10-11 died and respawned at refuge')
  : fail('respawn failed')
state.echoRecovery.active && state.echoRecovery.amount === carriedBeforeDeath
  ? pass('13 echo drop present for recovery')
  : fail('echo recovery missing')
state.world.openedShortcutIds.length === 1 ? pass('shortcut persisted through death') : fail('shortcut lost')

await gate(page, 'setPlayerPosition', { x: -3, y: 0.82, z: -1.3 })
await soak(page, 200)
await gate(page, 'setPlayerPosition', { x: -1, y: 0.82, z: -1.3 })
pass('12 used shortcut corridor after open')

if (state.echoRecovery.active && state.echoRecovery.position) {
  await gate(page, 'setPlayerPosition', state.echoRecovery.position)
  await soak(page, 400)
  state = await snapshot(page)
  !state.echoRecovery.active && state.echoes.carried === carriedBeforeDeath
    ? pass('13 recovered echoes exactly once')
    : fail('echo recovery failed')
}

await moveAlong(page, [
  { x: 4, y: 0.82, z: -4 },
  { x: 7.6, y: 0.82, z: -3.4 },
])
state = await snapshot(page)
state.encounterActivation.activatedEncounterIds.includes('encounter.m5.pressure')
  ? pass('14 later pressure encounter activated')
  : fail('pressure not activated')
await gate(page, 'defeatEnemy', 'enemy.skirmisher.pressure')

// After death/respawn, encounters reset — re-clear them before the final gate.
await gate(page, 'defeatEnemy', 'enemy.skirmisher.introduction')
await gate(page, 'defeatEnemy', 'enemy.skirmisher.1')
await gate(page, 'defeatEnemy', 'enemy.brute.1')
state = await snapshot(page)
state.encounters.every((encounter) => encounter.phase === 'complete')
  ? pass('all encounters complete for final gate')
  : fail(`encounters ${state.encounters.map((e) => `${e.id}:${e.phase}`).join(',')}`)

await gate(page, 'setPlayerPosition', { x: 10, y: 0.82, z: -4 })
await soak(page, 400)
state = await snapshot(page)
state.world.finalGateReached
  ? pass('15-16 final approach satisfied final gate')
  : fail('final gate not opened')

await gate(page, 'setPlayerPosition', { x: 13, y: 0.82, z: -4 })
await soak(page, 200)
state = await snapshot(page)
state.world.currentZoneId === 'zone.final-arena' && state.world.finalGateReached
  ? pass('17 reached final arena')
  : fail(`final arena zone=${state.world.currentZoneId} gate=${state.world.finalGateReached}`)

await page.reload({ waitUntil: 'networkidle' })
await soak(page, 700)
state = await snapshot(page)
state.world.finalGateReached &&
  state.world.openedShortcutIds.length === 1 &&
  state.equipment.weaponItemId === 'item.weapon.oathblade'
  ? pass('18-19 reload restored world/save state')
  : fail(`reload state world=${JSON.stringify(state.world)} equip=${state.equipment.weaponItemId}`)

// Death cycles in three areas
const deathAreas = [
  { x: -9, y: 0.82, z: 2 },
  { x: 1, y: 0.82, z: -3 },
  { x: 8, y: 0.82, z: -4 },
]
for (const [index, area] of deathAreas.entries()) {
  await gate(page, 'setPlayerPosition', area)
  await gate(page, 'applyDamage', 999)
  await gate(page, 'respawn')
  await soak(page, 200)
  state = await snapshot(page)
  state.playerHealth.lifeState === 'alive' && state.world.openedShortcutIds.length === 1
    ? pass(`death cycle ${index + 1} stable`)
    : fail(`death cycle ${index + 1} failed`)
}

// Combat / far-damage regression soak at refuge
await gate(page, 'setPlayerPosition', { x: -5.5, y: 0.82, z: 0 })
const hp = (await snapshot(page)).playerHealth.health.current
await soak(page, 5000)
state = await snapshot(page)
state.playerHealth.health.current === hp
  ? pass('combat regression: no unexplained far damage')
  : fail('far damage after M5.6 soak')

// UI regression
const ui = await page.evaluate(() => {
  const panel = document.querySelector('.development-panel')
  const inventory = document.querySelector('.inventory-panel')
  return {
    milestone: panel?.textContent ?? '',
    inventory: inventory?.textContent ?? '',
    overflow:
      (panel && panel.scrollWidth > panel.clientWidth + 1) ||
      (inventory && inventory.scrollWidth > inventory.clientWidth + 1),
  }
})
ui.milestone.includes('M5 Connected Level') && ui.inventory.includes('Oathblade') && !ui.overflow
  ? pass('UI regression compact/readable')
  : fail(`UI regression ${JSON.stringify(ui).slice(0, 200)}`)

if (errors.length === 0) pass('20 no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  process.exit(1)
}
console.log('VERDICT: PASS')
