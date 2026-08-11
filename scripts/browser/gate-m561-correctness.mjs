import { launchGateChromium } from './trackedGateBrowser.mjs'

const BASE = 'http://127.0.0.1:4173/'
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
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

function stoppedAtSolidFace(position, center, halfExtent, capsuleRadius = 0.35) {
  // Character controller may soft-contact; reject only deep center penetration.
  const solidFace = center.z + halfExtent
  const idealStop = solidFace + capsuleRadius
  const centerOutsideSolid = position.z >= solidFace + 0.04
  const approached = position.z <= idealStop + 0.7
  const aligned = Math.abs(position.x - center.x) < 0.55
  return centerOutsideSolid && approached && aligned
}

const browser = await launchGateChromium({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
await page.goto(BASE, { waitUntil: 'networkidle' })
await fresh(page)

// Confirm gate movement API is live
const movementProbe = await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.setPlayerPosition({ x: -6, y: 0.82, z: 0 })
  api.advance(30, { horizontal: 1, forward: 0 })
  return api.snapshot().player.position
})
movementProbe.x > -5.7
  ? pass(`gate movement API live x=${movementProbe.x.toFixed(2)}`)
  : fail(`gate movement API dead x=${movementProbe.x}`)

// --- Mouse aim cardinals / diagonals ---
await gate(page, 'restorePlayer')
await gate(page, 'setPlayerPosition', { x: -6, y: 0.82, z: 0 })
const aimCases = [
  ['north', { x: 0, z: -1 }],
  ['south', { x: 0, z: 1 }],
  ['east', { x: 1, z: 0 }],
  ['west', { x: -1, z: 0 }],
  ['ne', { x: Math.SQRT1_2, z: -Math.SQRT1_2 }],
  ['nw', { x: -Math.SQRT1_2, z: -Math.SQRT1_2 }],
  ['se', { x: Math.SQRT1_2, z: Math.SQRT1_2 }],
  ['sw', { x: -Math.SQRT1_2, z: Math.SQRT1_2 }],
]
for (const [label, aim] of aimCases) {
  // Burst request+poll inside one evaluate so the live rAF cannot finish the
  // attack before we observe execution facing / active contact.
  const result = await page.evaluate((aimDirection) => {
    const api = window.__MOURNEVEIL_GATE__
    api.requestAttack(aimDirection, 'light')
    const accepted = api.snapshot()
    let active = null
    for (let i = 0; i < 20; i += 1) {
      api.advance(1)
      const snap = api.snapshot()
      if (snap.attack.activeContactShape) {
        active = snap
        break
      }
    }
    return {
      executionFacing: accepted.attack.executionFacing,
      contact: active?.attack.activeContactShape ?? null,
      player: active?.player.position ?? accepted.player.position,
    }
  }, aim)
  const execOk =
    result.executionFacing &&
    Math.abs(result.executionFacing.x - aim.x) < 0.05 &&
    Math.abs(result.executionFacing.z - aim.z) < 0.05
  const alongAim =
    result.contact &&
    (result.contact.center.x - result.player.x) * aim.x +
      (result.contact.center.z - result.player.z) * aim.z >
      0.2
  execOk && alongAim
    ? pass(`aim ${label}`)
    : fail(
        `aim ${label} exec=${JSON.stringify(result.executionFacing)} contact=${JSON.stringify(result.contact?.center)}`,
      )
  await page.evaluate(() => {
    const api = window.__MOURNEVEIL_GATE__
    api.advance(40)
  })
}

// Move then click opposite prior facing via pointer
await gate(page, 'setPlayerPosition', { x: -6, y: 0.82, z: 0 })
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.requestAttack({ x: 0, z: -1 }, 'light')
  api.advance(45)
})
await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  const rect = canvas.getBoundingClientRect()
  const clientX = rect.left + rect.width * 0.78
  const clientY = rect.top + rect.height * 0.78
  for (const type of ['pointerdown', 'pointerup']) {
    canvas.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        button: 0,
        buttons: type === 'pointerdown' ? 1 : 0,
        pointerId: 1,
        pointerType: 'mouse',
      }),
    )
  }
})
await soak(page, 80)
let state = await snapshot(page)
const clickFacing = state.attack.executionFacing
clickFacing && (clickFacing.z > 0.2 || clickFacing.x > 0.2)
  ? pass(`pointer re-aim after north facing=${JSON.stringify(clickFacing)}`)
  : fail(`pointer stuck north ${JSON.stringify(clickFacing)}`)
await page.evaluate(() => window.__MOURNEVEIL_GATE__.advance(40))

await page.keyboard.press('F3')
await soak(page, 80)
await page.setViewportSize({ width: 1100, height: 720 })
await soak(page, 200)
const resizeAim = await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.requestAttack({ x: -1, z: 0 }, 'light')
  return api.snapshot().attack.executionFacing
})
resizeAim?.x < -0.9
  ? pass('aim after F3 Details+resize')
  : fail(`aim after resize ${JSON.stringify(resizeAim)}`)
await page.keyboard.press('F3')
await page.setViewportSize({ width: 1280, height: 800 })
await page.evaluate(() => window.__MOURNEVEIL_GATE__.advance(40))

// --- Collision A: watch-column via live Rapier-stepped movement ---
await fresh(page)
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.defeatEnemy('enemy.skirmisher.introduction')
  api.setPlayerPosition({ x: -10.4, y: 0.82, z: 2.7 })
  api.setMovementOverride({ horizontal: 0, forward: 1 })
})
await soak(page, 2500)
await gate(page, 'setMovementOverride', null)
state = await snapshot(page)
stoppedAtSolidFace(state.player.position, { x: -10.4, z: 1.2 }, 0.225)
  ? pass(`A player stopped at watch-column z=${state.player.position.z.toFixed(2)}`)
  : fail(`A watch-column stop failed ${JSON.stringify(state.player.position)}`)

// --- Collision B: approach-cairn ---
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.setPlayerPosition({ x: 8.4, y: 0.82, z: -0.6 })
  api.setMovementOverride({ horizontal: 0, forward: 1 })
})
await soak(page, 2500)
await gate(page, 'setMovementOverride', null)
state = await snapshot(page)
stoppedAtSolidFace(state.player.position, { x: 8.4, z: -2.4 }, 0.35)
  ? pass(`B player stopped at approach-cairn z=${state.player.position.z.toFixed(2)}`)
  : fail(`B approach-cairn stop failed ${JSON.stringify(state.player.position)}`)

// Diagonal creep into court-obelisk
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.setPlayerPosition({ x: 0.1, y: 0.82, z: -5.2 })
  api.setMovementOverride({ horizontal: 1, forward: 1 })
})
await soak(page, 2800)
await gate(page, 'setMovementOverride', null)
state = await snapshot(page)
const dx = Math.max(Math.abs(state.player.position.x - 1.1) - 0.2, 0)
const dz = Math.max(Math.abs(state.player.position.z + 6.4) - 0.2, 0)
Math.hypot(dx, dz) >= 0.26 && state.player.position.y > 0.5
  ? pass(`diagonal court-obelisk stable ${JSON.stringify(state.player.position)}`)
  : fail(`diagonal penetrated obelisk ${JSON.stringify(state.player.position)}`)

// --- HP drain soak at watch-column footprint ---
await fresh(page)
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.setPlayerPosition({ x: -10.4, y: 0.82, z: 1.2 })
})
const hp0 = (await snapshot(page)).playerHealth.health.current
await soak(page, 6500)
state = await snapshot(page)
const hp1 = state.playerHealth.health.current
if (hp1 === hp0) {
  pass('D no HP drain while occupying watch-column footprint')
} else {
  const intro = state.enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
  const dist = intro
    ? Math.hypot(
        intro.position.x - state.player.position.x,
        intro.position.z - state.player.position.z,
      )
    : null
  const face = 1.2 + 0.225 + 0.28
  const outside = state.player.position.z >= face - 0.05
  if (
    outside &&
    state.incomingContact?.lastHit?.attackerId === 'enemy.skirmisher.introduction' &&
    dist !== null &&
    dist < 1.5
  ) {
    pass('D HP change only from legitimate clear-LOS introduction melee after displacement')
  } else {
    fail(
      `D unexplained HP ${hp0}->${hp1} hit=${JSON.stringify(state.incomingContact?.lastHit)} pos=${JSON.stringify(state.player.position)}`,
    )
  }
}

// Refuge soak
await page.evaluate(() => {
  const api = window.__MOURNEVEIL_GATE__
  api.restorePlayer()
  api.setPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
})
const refugeHp = (await snapshot(page)).playerHealth.health.current
await soak(page, 4500)
state = await snapshot(page)
state.playerHealth.health.current === refugeHp
  ? pass('D refuge soak drain-free')
  : fail('D refuge unexplained drain')

await gate(page, 'interactWorld')
state = await snapshot(page)
state.checkpoint.activated ? pass('checkpoint activate') : fail('checkpoint not activated')

if (errors.length === 0) pass('no uncaught browser errors')
else fail(errors.join(' | '))

await browser.close()
if (failures.length > 0) {
  console.error('VERDICT: FAIL')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('VERDICT: PASS')
