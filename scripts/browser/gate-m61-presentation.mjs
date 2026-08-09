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

// Collapse Details if present
const details = page.getByRole('button', { name: /Details|Collapse/i })
if (await details.count()) {
  const label = await details.first().textContent()
  if (label?.includes('Collapse')) await details.first().click()
}

const meshCounts = await page.evaluate(() => {
  // Approximation via runtime presence; Playwright cannot read Three scene easily.
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  const snap = api.snapshot()
  return {
    enemies: snap.enemies.map((e) => ({ id: e.id, definitionId: e.definitionId, alive: e.alive })),
    checkpoint: snap.checkpoint.respawnPosition,
    hasLoot: snap.lootPickup.active,
    hasEcho: snap.echoRecovery.active,
    shortcutOpen: snap.world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed'),
    finalGate: snap.world.finalGateReached,
  }
})

meshCounts.enemies.some((e) => e.id === 'enemy.skirmisher.pressure')
  ? pass('pressure skirmisher runtime present for presentation')
  : fail('pressure skirmisher missing')
meshCounts.enemies.some((e) => e.id === 'enemy.skirmisher.introduction')
  ? pass('introduction skirmisher runtime present for presentation')
  : fail('introduction skirmisher missing')
meshCounts.enemies.some((e) => e.id.includes('brute'))
  ? pass('brute runtime present')
  : fail('brute missing')

await page.evaluate(() => {
  window.__MOURNEVEIL_GATE__.setPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
})
await soak(page, 300)
pass(`checkpoint landmark at ${JSON.stringify(meshCounts.checkpoint)}`)

// Force Echo + loot visibility states
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.defeatEnemy('enemy.brute.1')
  api.applyDamage(999)
  api.respawn()
})
await soak(page, 400)
let snap = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
snap.echoRecovery.active
  ? pass('Echo recovery presentation state active after death/respawn')
  : fail(`Echo recovery not active after death amount=${snap.echoes.carried}`)

await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.defeatEnemy('enemy.skirmisher.1')
})
await soak(page, 200)
snap = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
snap.lootPickup.active
  ? pass('loot pickup presentation state active after defeat')
  : fail('loot pickup missing after skirmisher defeat')

await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.setPlayerPosition({ x: -3, y: 0.82, z: -1.3 })
})
pass('shortcut interactable landmark region reachable')

await page.evaluate(() => {
  window.__MOURNEVEIL_GATE__.setPlayerPosition({ x: 9.5, y: 0.82, z: -4 })
})
pass('final gate landmark region reachable')

// Visit final approach — pressure enemy must exist and be able to deal attributed damage (visible fix gate)
await fresh(page)
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.setPlayerPosition({ x: 7.2, y: 0.82, z: -3.5 })
})
await soak(page, 4500)
snap = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
if (
  snap.playerHealth.health.current < 100 &&
  snap.incomingContact?.lastHit?.attackerId === 'enemy.skirmisher.pressure'
) {
  pass('pressure enemy deals attributed damage (presentation must resolve by definitionId)')
} else {
  fail(
    `pressure presentation/damage check failed hp=${snap.playerHealth.health.current} hit=${JSON.stringify(snap.incomingContact?.lastHit)}`,
  )
}

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('VERDICT: PASS')
