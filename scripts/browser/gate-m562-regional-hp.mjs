import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:4173/'
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function snapshot(page) {
  return page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
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

async function placeNeutralized(page, position) {
  await page.evaluate((pos) => {
    const api = window.__MOURNEVEIL_GATE__
    api.restorePlayer()
    for (const enemy of api.snapshot().enemies) {
      if (enemy.alive) api.defeatEnemy(enemy.id)
    }
    api.setPlayerPosition(pos)
  }, position)
}

const SAFE_POINTS = [
  { id: 'arrival', x: -14, z: 6 },
  { id: 'first-combat', x: -11.2, z: 1.2 },
  { id: 'checkpoint', x: -5.5, z: 0 },
  { id: 'mixed', x: 0, z: -6.2 },
  { id: 'shortcut', x: -3.2, z: -1.2 },
  { id: 'final-approach-west', x: 4.5, z: -4 },
  { id: 'final-approach-po', x: 8.5, z: -3.5 },
  { id: 'final-gate', x: 9.5, z: -4 },
  { id: 'final-arena', x: 13, z: -4 },
]

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })

for (const point of SAFE_POINTS) {
  await fresh(page)
  await placeNeutralized(page, { x: point.x, y: 0.82, z: point.z })
  await soak(page, 200)
  const before = await snapshot(page)
  const hp0 = before.playerHealth.health.current
  await soak(page, 6500)
  const after = await snapshot(page)
  const hp1 = after.playerHealth.health.current
  const alive = after.enemies.filter((enemy) => enemy.alive).map((enemy) => enemy.id)
  if (alive.length > 0) {
    fail(`${point.id} still has living enemies: ${alive.join(',')}`)
  } else if (hp1 !== hp0) {
    fail(
      `${point.id} unexplained drain ${hp0}->${hp1} hit=${JSON.stringify(after.incomingContact?.lastHit)}`,
    )
  } else {
    pass(`${point.id} soak HP stable ${hp0}`)
  }
}

// Legitimate pressure attribution: live enemy must be the only damage source.
await fresh(page)
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.setPlayerPosition({ x: 7.2, y: 0.82, z: -3.5 })
})
await soak(page, 200)
const liveBefore = await snapshot(page)
const liveHp0 = liveBefore.playerHealth.health.current
await soak(page, 6500)
const liveAfter = await snapshot(page)
const liveHp1 = liveAfter.playerHealth.health.current
const last = liveAfter.incomingContact?.lastHit
if (liveHp1 >= liveHp0) {
  fail(`pressure encounter did not deal expected attributed damage (${liveHp0}->${liveHp1})`)
} else if (last?.attackerId !== 'enemy.skirmisher.pressure') {
  fail(`pressure drain attributed to ${JSON.stringify(last)}`)
} else {
  pass(
    `final-approach live drain attributed to pressure skirmisher (${liveHp0}->${liveHp1})`,
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
console.log('HAZARD: none — only authored enemy melee damages the player')
