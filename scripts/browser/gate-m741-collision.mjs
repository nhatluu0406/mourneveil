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

async function defeatAll(page) {
  await page.evaluate(() => {
    const api = window.__MOURNEVEIL_GATE__
    for (const enemy of api.snapshot().enemies) api.defeatEnemy(enemy.id)
  })
}

function clearance(position, solid) {
  const dx = Math.max(Math.abs(position.x - solid.x) - solid.hx, 0)
  const dz = Math.max(Math.abs(position.z - solid.z) - solid.hz, 0)
  return Math.hypot(dx, dz)
}

async function pushCase(page, { name, start, move, solid, minClearance = 0.29 }) {
  await page.evaluate(({ start, move }) => {
    const api = window.__MOURNEVEIL_GATE__
    api.restorePlayer()
    for (const enemy of api.snapshot().enemies) api.defeatEnemy(enemy.id)
    api.setPlayerPosition(start)
    api.setMovementOverride(move)
  }, { start, move })
  await soak(page, 2600)
  await page.evaluate(() => window.__MOURNEVEIL_GATE__.setMovementOverride(null))
  const position = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot().player.position)
  const gap = clearance(position, solid)
  const centerInside =
    Math.abs(position.x - solid.x) < solid.hx && Math.abs(position.z - solid.z) < solid.hz
  if (centerInside || gap < minClearance || !Number.isFinite(position.x)) {
    fail(`${name} penetrated clearance=${gap.toFixed(3)} pos=${JSON.stringify(position)}`)
  } else {
    pass(`${name} clearance=${gap.toFixed(3)}`)
  }
  return position
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })
await fresh(page)
await defeatAll(page)

const divider = { x: -3, z: -3.6, hx: 0.25, hz: 1.4 }
const choke = { x: -11, z: -2, hx: 0.25, hz: 6.5 }
const finalSouth = { x: 10, z: -7.2, hx: 0.25, hz: 1.6 }

await pushCase(page, {
  name: 'divider west cardinal',
  start: { x: -4.4, y: 0.82, z: -3.6 },
  move: { horizontal: 1, forward: 0 },
  solid: divider,
})
await pushCase(page, {
  name: 'divider east cardinal',
  start: { x: -1.6, y: 0.82, z: -3.6 },
  move: { horizontal: -1, forward: 0 },
  solid: divider,
})
await pushCase(page, {
  name: 'divider west diagonal',
  start: { x: -4.4, y: 0.82, z: -2.9 },
  move: { horizontal: 1, forward: 1 },
  solid: divider,
})
await pushCase(page, {
  name: 'arrival-choke east',
  start: { x: -10.1, y: 0.82, z: 2 },
  move: { horizontal: -1, forward: 0 },
  solid: choke,
})
await pushCase(page, {
  name: 'final-divider south segment',
  start: { x: 8.7, y: 0.82, z: -6.2 },
  move: { horizontal: 1, forward: 0 },
  solid: finalSouth,
})

// Direction reversal soak
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  for (const enemy of api.snapshot().enemies) api.defeatEnemy(enemy.id)
  api.setPlayerPosition({ x: -4.3, y: 0.82, z: -3.6 })
})
for (let i = 0; i < 6; i += 1) {
  await page.evaluate((dir) => window.__MOURNEVEIL_GATE__.setMovementOverride({ horizontal: dir, forward: 0 }), i % 2 === 0 ? 1 : -1)
  await soak(page, 400)
}
await page.evaluate(() => window.__MOURNEVEIL_GATE__.setMovementOverride(null))
let position = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot().player.position)
clearance(position, divider) >= 0.29
  ? pass(`reversal soak clearance=${clearance(position, divider).toFixed(3)}`)
  : fail(`reversal soak penetrated ${JSON.stringify(position)}`)

// Attack then move into wall
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  for (const enemy of api.snapshot().enemies) api.defeatEnemy(enemy.id)
  api.setPlayerPosition({ x: -4.4, y: 0.82, z: -3.6 })
  api.requestAttack({ x: 1, z: 0 }, 'light')
  api.setMovementOverride({ horizontal: 1, forward: 0 })
})
await soak(page, 2200)
await page.evaluate(() => window.__MOURNEVEIL_GATE__.setMovementOverride(null))
position = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot().player.position)
clearance(position, divider) >= 0.29
  ? pass(`attack-then-push clearance=${clearance(position, divider).toFixed(3)}`)
  : fail(`attack-then-push penetrated ${JSON.stringify(position)}`)

// Respawn then approach
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.setPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
  api.interactCheckpoint()
  api.applyDamage(999)
  api.respawn()
})
await soak(page, 400)
await pushCase(page, {
  name: 'post-respawn divider',
  start: { x: -4.4, y: 0.82, z: -3.6 },
  move: { horizontal: 1, forward: 0 },
  solid: divider,
})

// Reload then approach
await fresh(page)
await pushCase(page, {
  name: 'post-reload divider',
  start: { x: -4.4, y: 0.82, z: -3.6 },
  move: { horizontal: 1, forward: 0 },
  solid: divider,
})

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('VERDICT: PASS')
