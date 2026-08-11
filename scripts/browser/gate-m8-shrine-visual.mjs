import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = 'http://127.0.0.1:4173/'
const OUT = 'tmp-m8-shrine'
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

function horizontalDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
const assetFailures = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (msg) => {
  const text = msg.text()
  if (/failed to load|useGLTF|THREE\.GLTFLoader|404.*assets/i.test(text)) {
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

const initial = await snapshot(page)
const shrine = initial.checkpoint.visualPosition
const spawn = initial.player.position
const spawnClearance = horizontalDistance(spawn, shrine)
spawnClearance >= 0.9
  ? pass(`fresh spawn clearance from shrine visual=${spawnClearance.toFixed(3)}`)
  : fail(`fresh spawn too close to shrine visual=${spawnClearance.toFixed(3)}`)

await gate(page, 'setPlayerPosition', {
  x: initial.checkpoint.interactionPosition.x,
  y: initial.checkpoint.interactionPosition.y,
  z: initial.checkpoint.interactionPosition.z,
})
await soak(page, 200)
await page.screenshot({ path: `${OUT}/01-interaction-approach.png` })
pass('screenshot interaction approach')

const promptVisible = await page.locator('text=/rest|checkpoint|refuge/i').count()
promptVisible > 0
  ? pass('checkpoint interaction prompt visible near interaction anchor')
  : fail('checkpoint interaction prompt missing near interaction anchor')

await gate(page, 'interactCheckpoint')
await soak(page, 250)
const rested = await snapshot(page)
rested.checkpoint.activated
  ? pass('checkpoint Rest accepted')
  : fail('checkpoint Rest not accepted')
await page.screenshot({ path: `${OUT}/02-rest-active.png` })
pass('screenshot rest active')

await gate(page, 'applyDamage', 999)
await soak(page, 200)
await gate(page, 'respawn')
await soak(page, 450)
const afterRespawn = await snapshot(page)
afterRespawn.playerHealth.health.alive
  ? pass('respawn alive')
  : fail('respawn not alive')
const respawnClearance = horizontalDistance(afterRespawn.player.position, shrine)
respawnClearance >= 0.9
  ? pass(`respawn clearance from shrine visual=${respawnClearance.toFixed(3)}`)
  : fail(`respawn too close to shrine visual=${respawnClearance.toFixed(3)}`)
const respawnDistance = horizontalDistance(
  afterRespawn.player.position,
  afterRespawn.checkpoint.respawnPosition,
)
respawnDistance <= 0.35
  ? pass(`respawn near authored respawn anchor=${respawnDistance.toFixed(3)}`)
  : fail(`respawn drifted from authored respawn=${respawnDistance.toFixed(3)}`)
await page.screenshot({ path: `${OUT}/03-respawn-clearance.png` })
pass('screenshot respawn clearance')

const shrineNode = await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  return {
    canvasPresent: canvas instanceof HTMLCanvasElement,
    productionAssetMounted: Boolean(
      [...document.querySelectorAll('*')].length &&
        window.__MOURNEVEIL_GATE__?.snapshot()?.checkpoint?.visualPosition,
    ),
  }
})
shrineNode.canvasPresent ? pass('canvas present') : fail('canvas missing')

assetFailures.length === 0
  ? pass('no asset-load console/network failures')
  : fail(`asset failures: ${assetFailures.join(' | ')}`)
errors.length === 0 ? pass('no uncaught page errors') : fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error(`\n${failures.length} shrine visual gate failure(s)`)
  process.exit(1)
}
console.log('\nShrine visual gate PASS')
