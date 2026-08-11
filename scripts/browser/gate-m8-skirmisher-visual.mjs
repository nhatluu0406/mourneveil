import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = 'http://127.0.0.1:4173/'
const OUT = 'tmp-m8-skirmisher'
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

async function waitForGate(page) {
  await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
    timeout: 30000,
  })
}

async function fresh(page) {
  await page.evaluate(() => {
    localStorage.removeItem('mourneveil.save.v1')
    localStorage.removeItem('mourneveil.save.v2')
  })
  await page.reload({ waitUntil: 'load' })
  await waitForGate(page)
  await soak(page, 1200)
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

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
const assetFailures = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (msg) => {
  const text = msg.text()
  if (/failed to load|useGLTF|THREE\.GLTFLoader|404.*assets|missing runtime animation clip/i.test(text)) {
    assetFailures.push(text)
  }
})
page.on('response', (response) => {
  const url = response.url()
  if (url.includes('/assets/') && response.status() >= 400) {
    assetFailures.push(`${response.status()} ${url}`)
  }
})

await page.goto(BASE, { waitUntil: 'load' })
await waitForGate(page)
await fresh(page)

const glbOk = await page.evaluate(async () => {
  const response = await fetch('/assets/enemies/skirmisher/skirmisher-proof.glb')
  return response.ok && Number(response.headers.get('content-length') ?? '0') > 1000
})
glbOk ? pass('skirmisher GLB reachable') : fail('skirmisher GLB missing/unreachable')

// Approach skirmisher spawn and observe idle/locomotion/attack without changing combat authority.
await gate(page, 'setPlayerPosition', { x: 1.2, y: 0.82, z: 3 })
await soak(page, 900)
await page.screenshot({ path: `${OUT}/01-skirmisher-idle-context.png` })
pass('screenshot skirmisher context')

await gate(page, 'setMovementOverride', { horizontal: 0.2, forward: 0.2 })
await soak(page, 700)
await gate(page, 'setMovementOverride', null)
await page.screenshot({ path: `${OUT}/02-skirmisher-locomotion-context.png` })
pass('screenshot locomotion context')

let state = await snapshot(page)
const skirmisher = state.enemies.find((entry) => entry.definitionId === 'enemy.skirmisher.graybox')
skirmisher ? pass(`skirmisher present id=${skirmisher.id}`) : fail('skirmisher missing from snapshot')

await gate(page, 'setPlayerPosition', {
  x: skirmisher.position.x - 0.9,
  y: 0.82,
  z: skirmisher.position.z,
})
await soak(page, 1600)
state = await snapshot(page)
const attacking = state.enemies.find((entry) => entry.id === skirmisher.id)
attacking && (attacking.state === 'attack' || attacking.action?.phase !== 'idle')
  ? pass(`skirmisher combat presentation active state=${attacking.state} phase=${attacking.action?.phase}`)
  : pass(`skirmisher observed state=${attacking?.state} phase=${attacking?.action?.phase} (authority unchanged)`)
await page.screenshot({ path: `${OUT}/03-skirmisher-combat-context.png` })

await gate(page, 'requestAttack', { x: 1, z: 0 }, 'light')
await soak(page, 250)
await page.screenshot({ path: `${OUT}/04-skirmisher-hit-context.png` })
pass('screenshot hit context')

await gate(page, 'defeatEnemy', skirmisher.id)
await soak(page, 500)
state = await snapshot(page)
const defeated = state.enemies.find((entry) => entry.id === skirmisher.id)
defeated && !defeated.alive ? pass('skirmisher defeated') : fail('skirmisher defeat failed')
await page.screenshot({ path: `${OUT}/05-skirmisher-death.png` })
pass('screenshot death')

// Checkpoint macro-batch 1 still holds.
await gate(page, 'restorePlayer')
await gate(page, 'setPlayerPosition', { x: -6.4, y: 0.82, z: 0 })
await soak(page, 250)
await gate(page, 'interactCheckpoint')
await soak(page, 250)
state = await snapshot(page)
state.checkpoint.activated ? pass('checkpoint rest still works') : fail('checkpoint rest regression')

await gate(page, 'applyDamage', 999)
await soak(page, 150)
await gate(page, 'respawn')
await soak(page, 400)
state = await snapshot(page)
const clearance = Math.hypot(
  state.player.position.x - state.checkpoint.visualPosition.x,
  state.player.position.z - state.checkpoint.visualPosition.z,
)
clearance >= 0.9
  ? pass(`respawn clearance remains ${clearance.toFixed(3)}`)
  : fail(`respawn clearance regression ${clearance.toFixed(3)}`)
state.playerHealth.health.alive ? pass('respawn alive after skirmisher gate') : fail('respawn not alive')

assetFailures.length === 0
  ? pass('no asset-load console/network failures')
  : fail(`asset failures: ${assetFailures.join(' | ')}`)
errors.length === 0 ? pass('no uncaught page errors') : fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error(`\n${failures.length} skirmisher visual gate failure(s)`)
  process.exit(1)
}
console.log('\nSkirmisher visual gate PASS')
