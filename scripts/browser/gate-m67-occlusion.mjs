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

async function snapshot(page) {
  return page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })
await fresh(page)

// Walk into solid watch-column — must stop outside (no penetration)
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.setPlayerPosition({ x: -10.4, y: 0.82, z: 3.2 })
  api.setMovementOverride({ horizontal: 0, forward: -1 })
})
await soak(page, 2500)
await page.evaluate(() => window.__MOURNEVEIL_GATE__.setMovementOverride(null))
let state = await snapshot(page)
const face = 1.2 + 0.225 + 0.28
const stopped =
  state.player.position.z >= face - 0.12 && state.player.position.z <= face + 0.65
stopped
  ? pass(`solid watch-column stop z=${state.player.position.z.toFixed(2)}`)
  : fail(`watch-column stop unexpected z=${state.player.position.z}`)

// Stand behind shortcut divider — must remain alive / movable (occlusion fade only)
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.setPlayerPosition({ x: -4.2, y: 0.82, z: -1.3 })
})
await soak(page, 1200)
state = await snapshot(page)
state.playerHealth.health.alive
  ? pass('player readable path behind divider remains alive')
  : fail('unexpected death behind divider')

// Open shortcut: tall decorative tower must not remain as walk-through wall
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.setPlayerPosition({ x: -2, y: 0.82, z: -1.2 })
})
await soak(page, 100)
await page.evaluate(() => window.__MOURNEVEIL_GATE__.interactWorld())
state = await snapshot(page)
state.world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed')
  ? pass('shortcut opens for decorative contract check')
  : fail('shortcut failed to open')

await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.setPlayerPosition({ x: -3.2, y: 0.82, z: -1.3 })
  api.setMovementOverride({ horizontal: 1, forward: 0 })
})
await soak(page, 1800)
await page.evaluate(() => window.__MOURNEVEIL_GATE__.setMovementOverride(null))
state = await snapshot(page)
state.player.position.x > -2.6
  ? pass(`walk through open shortcut corridor x=${state.player.position.x.toFixed(2)}`)
  : fail(`blocked by phantom decorative gate x=${state.player.position.x}`)

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('VERDICT: PASS')
