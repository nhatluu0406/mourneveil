import { mkdir } from 'node:fs/promises'
import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m8-stabilization'
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function soak(page, ms) {
  const slice = 40
  for (let index = 0; index < Math.ceil(ms / slice); index += 1) {
    await page.waitForTimeout(slice)
  }
}

async function waitForGate(page) {
  await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
    timeout: 30_000,
  })
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

async function fresh(page) {
  await page.evaluate(() => {
    localStorage.removeItem('mourneveil.save.v1')
    localStorage.removeItem('mourneveil.save.v2')
  })
  await page.reload({ waitUntil: 'load' })
  await waitForGate(page)
  await soak(page, 900)
}

async function defeatAll(page) {
  await page.evaluate(() => {
    const api = window.__MOURNEVEIL_GATE__
    for (const enemy of api.snapshot().enemies) api.defeatEnemy(enemy.id)
  })
}

async function poseNearWall(page, { name, position, facing, movement }) {
  await gate(page, 'restorePlayer')
  await gate(page, 'setPlayerPosition', position)
  await gate(page, 'requestAttack', facing, 'light')
  await gate(page, 'advance', 30)
  await soak(page, 180)
  await page.screenshot({ path: `${OUT}/${name}-idle.png` })

  if (movement) {
    await gate(page, 'setMovementOverride', movement)
    await soak(page, 450)
    await gate(page, 'setMovementOverride', null)
    await page.screenshot({ path: `${OUT}/${name}-locomotion.png` })
  }

  const beforeAttack = await snapshot(page)
  const accepted = await gate(page, 'requestAttack', facing, 'light')
  if (!accepted) fail(`${name} attack request was rejected from phase=${beforeAttack.combat.phase}`)
  const active = await gate(page, 'advance', 8)
  active.combat.phase !== 'idle'
    ? pass(`${name} attack presentation captured in phase=${active.combat.phase}`)
    : fail(`${name} attack returned to idle before capture`)
  await page.screenshot({ path: `${OUT}/${name}-attack.png` })
  if (beforeAttack.playerHealth.health.current !== active.playerHealth.health.current) {
    fail(`${name} wall presentation changed player health unexpectedly`)
  }
  await gate(page, 'advance', 30)
  await gate(page, 'setPlayerPosition', {
    x: position.x - facing.x * 1.5,
    y: position.y,
    z: position.z - facing.z * 1.5,
  })
  await soak(page, 300)
  await page.screenshot({ path: `${OUT}/${name}-clear-restored.png` })
  pass(`${name} clear-space weapon restoration captured`)
}

await mkdir(OUT, { recursive: true })
let cleanupReport = null
await runOwnedBrowserGate({
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl }) => {
    const pageErrors = []
    const assetFailures = []
    let skirmisherProofRequested = false
    page.on('pageerror', (error) => pageErrors.push(String(error)))
    page.on('console', (message) => {
      const text = message.text()
      if (/failed to load|useGLTF|THREE\.GLTFLoader|404.*assets|missing runtime animation clip/i.test(text)) {
        assetFailures.push(text)
      }
    })
    page.on('request', (request) => {
      if (request.url().includes('/assets/enemies/skirmisher/skirmisher-proof.glb')) {
        skirmisherProofRequested = true
      }
    })

    await page.goto(baseUrl, { waitUntil: 'load' })
    await waitForGate(page)
    await fresh(page)
    let state = await snapshot(page)
    const shrineClearance = Math.hypot(
      state.player.position.x - state.checkpoint.visualPosition.x,
      state.player.position.z - state.checkpoint.visualPosition.z,
    )
    shrineClearance >= 0.9
      ? pass(`fresh checkpoint clearance=${shrineClearance.toFixed(3)}`)
      : fail(`fresh checkpoint clearance=${shrineClearance.toFixed(3)}`)
    await page.screenshot({ path: `${OUT}/01-fresh-checkpoint.png` })

    await gate(page, 'setPlayerPosition', state.checkpoint.interactionPosition)
    await soak(page, 160)
    await gate(page, 'interactCheckpoint')
    await gate(page, 'applyDamage', 999)
    await gate(page, 'respawn')
    await soak(page, 260)
    state = await snapshot(page)
    state.checkpoint.activated && state.playerHealth.health.alive
      ? pass('checkpoint rest and respawn remain valid')
      : fail('checkpoint rest/respawn regression')

    await defeatAll(page)
    await poseNearWall(page, {
      name: '02-divider-west',
      position: { x: -3.62, y: 0.82, z: -3.6 },
      facing: { x: 1, z: 0 },
      movement: { horizontal: 0, forward: 0.5 },
    })
    await poseNearWall(page, {
      name: '03-north-border',
      position: { x: 0, y: 0.82, z: 9.13 },
      facing: { x: 0, z: 1 },
      movement: { horizontal: 0.5, forward: 0 },
    })

    await fresh(page)
    state = await snapshot(page)
    const skirmisher = state.enemies.find(
      (enemy) => enemy.definitionId === 'enemy.skirmisher.graybox',
    )
    if (!skirmisher) fail('playable skirmisher missing')
    else {
      await gate(page, 'setPlayerPosition', {
        x: skirmisher.position.x - 0.9,
        y: 0.82,
        z: skirmisher.position.z,
      })
      await soak(page, 900)
      await page.screenshot({ path: `${OUT}/04-playable-skirmisher-procedural.png` })
      const enemyState = (await snapshot(page)).enemies.find((enemy) => enemy.id === skirmisher.id)
      enemyState?.alive ? pass(`procedural skirmisher combat state=${enemyState.state}`) : fail('skirmisher died unexpectedly')
      const healthBefore = enemyState?.health.current ?? 0
      await gate(page, 'requestAttack', { x: 1, z: 0 }, 'light')
      await soak(page, 650)
      const healthAfter = (await snapshot(page)).enemies.find(
        (enemy) => enemy.id === skirmisher.id,
      )?.health.current
      healthAfter !== undefined && healthAfter < healthBefore
        ? pass(`player attack authority unchanged (${healthBefore} -> ${healthAfter})`)
        : fail(`player attack did not damage skirmisher (${healthBefore} -> ${healthAfter})`)
    }
    skirmisherProofRequested
      ? fail('default gameplay requested the rejected skirmisher proof GLB')
      : pass('default gameplay did not request the proof GLB')

    assetFailures.length === 0
      ? pass('no asset-load failures')
      : fail(assetFailures.join(' | '))
    pageErrors.length === 0 ? pass('no uncaught page errors') : fail(pageErrors.join(' | '))
  },
})

if (!cleanupReport?.browserClosed || !cleanupReport?.serverExited || !cleanupReport?.portReusable) {
  fail(`owned cleanup incomplete: ${JSON.stringify(cleanupReport)}`)
}
if (failures.length > 0) {
  throw new Error(`${failures.length} M8 stabilization gate failure(s)\n${failures.join('\n')}`)
}
console.log('M8 stabilization gate PASS')
