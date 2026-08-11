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

async function soak(page, ms, slice = 50) {
  const iterations = Math.ceil(ms / slice)
  for (let i = 0; i < iterations; i += 1) {
    await page.waitForTimeout(slice)
  }
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
await soak(page, 800)

// --- Far / unexplained damage at refuge ---
await gate(page, 'setPlayerPosition', { x: -5.5, y: 0.82, z: 0 })
let before = await snapshot(page)
await soak(page, 8000)
let after = await snapshot(page)
after.playerHealth.health.current === before.playerHealth.health.current
  ? pass('no unexplained refuge damage')
  : fail(
      `refuge health ${before.playerHealth.health.current} -> ${after.playerHealth.health.current}; last=${JSON.stringify(after.incomingContact?.lastHit)}`,
    )
after.enemies.every((enemy) => enemy.state === 'idle' || enemy.state === 'defeated')
  ? pass('distant encounters stayed idle at refuge')
  : fail(`unexpected enemy states at refuge: ${after.enemies.map((e) => `${e.id}:${e.state}`).join(',')}`)

// --- Through-wall: activate mixed, lure to wall, stand opposite ---
await gate(page, 'setPlayerPosition', { x: 0, y: 0.82, z: -3 })
await soak(page, 500)
before = await snapshot(page)
before.encounterActivation.activatedEncounterIds.includes('encounter.m5.mixed')
  ? pass('mixed encounter activated in its zone')
  : fail(`mixed not activated: ${JSON.stringify(before.encounterActivation)}`)

await gate(page, 'setPlayerPosition', { x: -2.55, y: 0.82, z: -1.3 })
await soak(page, 4000)
await gate(page, 'setPlayerPosition', { x: -3.55, y: 0.82, z: -1.3 })
before = await snapshot(page)
const healthBeforeWall = before.playerHealth.health.current
await soak(page, 6000)
after = await snapshot(page)
const wallDelta = healthBeforeWall - after.playerHealth.health.current
const enemy = after.enemies.find((entry) => entry.id === 'enemy.skirmisher.1')
const separated =
  enemy !== undefined && enemy.position.x > -2.9 && after.player.position.x < -3.2
if (separated && wallDelta > 0) {
  fail(`through-wall damage delta=${wallDelta} attacker=${after.incomingContact?.lastHit?.attackerId}`)
} else {
  pass('no through-wall damage while separated by shortcut divider')
}

// --- Navigation: same-zone blocker detour while encounter stays active ---
await page.evaluate(() => localStorage.removeItem('mourneveil.save.v2'))
await page.reload({ waitUntil: 'networkidle' })
await soak(page, 800)
await gate(page, 'setPlayerPosition', { x: -9.5, y: 0.82, z: 2.5 })
await soak(page, 400)
await gate(page, 'setPlayerPosition', { x: -7.2, y: 0.82, z: 4.8 })
const samples = []
let reached = false
for (let i = 0; i < 24; i += 1) {
  await soak(page, 400)
  const state = await snapshot(page)
  const intro = state.enemies.find((entry) => entry.id === 'enemy.skirmisher.introduction')
  const dist = intro
    ? Math.hypot(intro.position.x - state.player.position.x, intro.position.z - state.player.position.z)
    : null
  samples.push({
    x: intro?.position.x,
    z: intro?.position.z,
    state: intro?.state,
    dist,
  })
  if (dist !== null && dist <= 1.4) {
    reached = true
    break
  }
}
reached
  ? pass('introduction skirmisher navigated around first-combat blocker')
  : fail(`navigation failed samples=${JSON.stringify(samples.slice(-6))}`)

// Cross-divider: mixed enemy must not permanently push into the closed shortcut wall.
await gate(page, 'setPlayerPosition', { x: 0, y: 0.82, z: -3 })
await soak(page, 400)
await gate(page, 'setPlayerPosition', { x: -3.55, y: 0.82, z: -1.3 })
const wallSamples = []
for (let i = 0; i < 12; i += 1) {
  await soak(page, 400)
  const state = await snapshot(page)
  const skirmisher = state.enemies.find((entry) => entry.id === 'enemy.skirmisher.1')
  wallSamples.push({ x: skirmisher?.position.x, z: skirmisher?.position.z, state: skirmisher?.state })
}
const idleOrRouted =
  wallSamples.some((sample) => sample.state === 'idle') ||
  wallSamples.some((sample) => (sample.z ?? 0) < -4.8)
idleOrRouted
  ? pass('mixed skirmisher did not permanently wall-push after player left zone')
  : fail(`wall-push samples=${JSON.stringify(wallSamples.slice(-4))}`)


// --- Reset / reload freshness ---
await gate(page, 'setPlayerPosition', { x: -5.5, y: 0.82, z: 0 })
await gate(page, 'interactWorld')
await gate(page, 'applyDamage', 999)
await gate(page, 'respawn')
await soak(page, 300)
after = await snapshot(page)
after.encounterActivation.activatedEncounterIds.length === 0
  ? pass('activation cleared on respawn reset')
  : fail(`activation after respawn: ${JSON.stringify(after.encounterActivation)}`)

await page.reload({ waitUntil: 'networkidle' })
await soak(page, 600)
after = await snapshot(page)
after.playerHealth.lifeState === 'alive'
  ? pass('reload remained stable')
  : fail('reload life state')

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  process.exit(1)
}
console.log('VERDICT: PASS')
