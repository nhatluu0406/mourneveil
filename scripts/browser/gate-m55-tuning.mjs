import { chromium } from 'playwright'

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
  const slice = 50
  for (let i = 0; i < Math.ceil(ms / slice); i += 1) await page.waitForTimeout(slice)
}

const browser = await chromium.launch({ headless: true })
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

let state = await snapshot(page)
const intro = state.enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
intro && Math.hypot(intro.position.x + 10.2, intro.position.z - 3.1) < 0.2
  ? pass('introduction stand-off placement')
  : fail(`intro spawn ${JSON.stringify(intro?.position)}`)

// Arrival should not activate introduction.
await gate(page, 'setPlayerPosition', { x: -14, y: 0.82, z: 6 })
await soak(page, 1500)
state = await snapshot(page)
!state.encounterActivation.activatedEncounterIds.includes('encounter.m5.introduction')
  ? pass('arrival does not activate introduction')
  : fail('introduction activated from arrival')

// Enter first combat intentionally.
await gate(page, 'setPlayerPosition', { x: -10.2, y: 0.82, z: 3.1 })
await soak(page, 400)
state = await snapshot(page)
state.encounterActivation.activatedEncounterIds.includes('encounter.m5.introduction')
  ? pass('introduction activates in Outer Watch')
  : fail('introduction failed to activate')

// Leave to refuge — no chase damage.
await gate(page, 'setPlayerPosition', { x: -5.5, y: 0.82, z: 0 })
const health = (await snapshot(page)).playerHealth.health.current
await soak(page, 4000)
state = await snapshot(page)
state.playerHealth.health.current === health
  ? pass('no chase damage after leaving introduction zone')
  : fail('chase damage at refuge after introduction')

// Mixed spacing + navigation soak around blockers.
await gate(page, 'setPlayerPosition', { x: 1.4, y: 0.82, z: -2.6 })
await soak(page, 500)
await gate(page, 'setPlayerPosition', { x: -1.4, y: 0.82, z: -5.8 })
const samples = []
for (let i = 0; i < 20; i += 1) {
  await soak(page, 350)
  state = await snapshot(page)
  const skirmisher = state.enemies.find((e) => e.id === 'enemy.skirmisher.1')
  const brute = state.enemies.find((e) => e.id === 'enemy.brute.1')
  samples.push({
    s: skirmisher && { x: skirmisher.position.x, z: skirmisher.position.z, state: skirmisher.state },
    b: brute && { x: brute.position.x, z: brute.position.z, state: brute.state },
  })
}
const moved = samples.some((sample) => sample.s && (sample.s.z < -4 || sample.s.x < 0))
moved
  ? pass('mixed skirmisher progressed around court geometry')
  : fail(`mixed nav soak stuck ${JSON.stringify(samples.slice(-3))}`)

// Shortcut recovery path: open from mixed side, die, respawn, confirm shortcut open.
await gate(page, 'setPlayerPosition', { x: 0, y: 0.82, z: -3 })
await soak(page, 300)
await gate(page, 'setPlayerPosition', { x: -1.9, y: 0.82, z: -1.0 })
await soak(page, 300)
state = await snapshot(page)
state.world.currentZoneId === 'zone.mixed-combat'
  ? pass('standing on mixed side before shortcut')
  : fail(`expected mixed zone, got ${state.world.currentZoneId}`)
await gate(page, 'interactWorld')
await soak(page, 100)
state = await snapshot(page)
state.world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed')
  ? pass('shortcut opened from authored far side')
  : fail(`shortcut open failed zone=${state.world.currentZoneId}`)

await gate(page, 'setPlayerPosition', { x: -5.5, y: 0.82, z: 0 })
await gate(page, 'interactWorld')
await gate(page, 'applyDamage', 999)
await gate(page, 'respawn')
await soak(page, 300)
state = await snapshot(page)
state.world.openedShortcutIds.length === 1 && state.playerHealth.lifeState === 'alive'
  ? pass('recovery respawn preserved shortcut')
  : fail('recovery/shortcut persistence failed')

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  process.exit(1)
}
console.log('VERDICT: PASS')
