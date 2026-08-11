import { mkdir } from 'node:fs/promises'
import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m9-guard-depth'
const PORT = 4195
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

async function holdGuard(page) {
  const canvas = page.locator('canvas')
  await canvas.waitFor({ state: 'visible' })
  const bounds = await canvas.boundingBox()
  if (bounds === null) throw new Error('Gameplay canvas has no bounds')
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down({ button: 'right' })
}

async function releaseGuard(page) {
  await page.mouse.up({ button: 'right' })
}

async function isolateIntroduction(page, position, facing) {
  const state = await snapshot(page)
  for (const enemy of state.enemies) {
    if (enemy.id !== 'enemy.skirmisher.introduction') {
      await gate(page, 'defeatEnemy', enemy.id)
    }
  }
  await gate(page, 'setPlayerPosition', position)
  await gate(page, 'setPlayerFacing', facing)
}

async function collectIncomingOutcomes(page, count, timeoutMs = 12_000) {
  const outcomes = []
  const baselineHit = (await snapshot(page)).incomingContact.lastHit
  let lastKey =
    baselineHit === null
      ? null
      : `${baselineHit.attackerId}:${baselineHit.executionId}:${baselineHit.simulationStep}`
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline && outcomes.length < count) {
    const state = await snapshot(page)
    const hit = state.incomingContact.lastHit
    if (hit !== null) {
      const key = `${hit.attackerId}:${hit.executionId}:${hit.simulationStep}`
      if (key !== lastKey) {
        lastKey = key
        outcomes.push(hit.outcome)
      }
    }
    await page.waitForTimeout(40)
  }
  return outcomes
}

await mkdir(OUT, { recursive: true })
let cleanupReport = null
await runOwnedBrowserGate({
  port: PORT,
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl }) => {
    const pageErrors = []
    page.on('pageerror', (error) => {
      pageErrors.push(String(error))
      console.error(`PAGE ERROR: ${error}`)
    })
    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    // The development bridge mounts before asynchronous Rapier integration.
    await page.waitForTimeout(1_000)

    await gate(page, 'resetMeleeFixture')
    await holdGuard(page)
    await page.waitForFunction(
      () => window.__MOURNEVEIL_GATE__.snapshot().defense.guarding,
      null,
      { timeout: 2_000 },
    )
    await isolateIntroduction(
      page,
      { x: -9.05, y: 0.82, z: 3.1 },
      { x: -1, z: 0 },
    )
    const pressureOutcomes = await collectIncomingOutcomes(page, 4)
    const pressureState = await snapshot(page)
    await page.screenshot({ path: `${OUT}/01-guard-break.png` })
    JSON.stringify(pressureOutcomes) ===
    JSON.stringify(['guarded', 'guarded', 'guard-broken', 'damaged'])
      ? pass(`frontal pressure outcomes=${pressureOutcomes.join(' → ')}`)
      : fail(
          `unexpected frontal pressure outcomes=${pressureOutcomes.join(' → ')} state=${JSON.stringify({
            defense: pressureState.defense,
            activation: pressureState.encounterActivation,
            enemy: pressureState.enemies.find(
              (enemy) => enemy.id === 'enemy.skirmisher.introduction',
            ),
          })}`,
        )
    pressureState.playerHealth.health.current < pressureState.playerHealth.health.maximum
      ? pass('attack during guard break damages canonical player health')
      : fail('guard-break pressure did not damage player')

    await releaseGuard(page)
    const recoveryDeadline = Date.now() + 5_000
    while (Date.now() < recoveryDeadline) {
      const defense = (await snapshot(page)).defense
      if (!defense.guardBroken) break
      await page.waitForTimeout(40)
    }
    await holdGuard(page)
    await page.waitForTimeout(120)
    const recovered = await snapshot(page)
    recovered.defense.guarding && !recovered.defense.guardBroken
      ? pass('held guard recovers deterministically after break')
      : fail(`guard did not recover cleanly: ${JSON.stringify(recovered.defense)}`)
    await page.screenshot({ path: `${OUT}/02-guard-recovered.png` })
    await releaseGuard(page)

    await gate(page, 'resetMeleeFixture')
    await holdGuard(page)
    await page.waitForFunction(
      () => window.__MOURNEVEIL_GATE__.snapshot().defense.guarding,
      null,
      { timeout: 2_000 },
    )
    await isolateIntroduction(
      page,
      { x: -9.05, y: 0.82, z: 3.1 },
      { x: 1, z: 0 },
    )
    const rearOutcomes = await collectIncomingOutcomes(page, 1, 6_000)
    const rearState = await snapshot(page)
    await page.screenshot({ path: `${OUT}/03-rear-bypass.png` })
    rearOutcomes[0] === 'damaged' && rearState.playerHealth.health.current < 100
      ? pass('rear/out-of-sector attack bypasses held guard')
      : fail(
          `rear guard result=${rearOutcomes[0] ?? 'none'} state=${JSON.stringify({
            player: rearState.player,
            enemy: rearState.enemies.find(
              (enemy) => enemy.id === 'enemy.skirmisher.introduction',
            ),
          })}`,
        )
    await releaseGuard(page)

    pageErrors.length === 0
      ? pass('no page errors')
      : fail(`page errors: ${pageErrors.join(' | ')}`)
  },
})

if (
  cleanupReport === null ||
  !cleanupReport.pageClosed ||
  !cleanupReport.browserClosed ||
  !cleanupReport.serverExited ||
  !cleanupReport.portReusable
) {
  fail(`owned cleanup failed: ${JSON.stringify(cleanupReport)}`)
} else {
  pass(`owned browser/server cleanup complete; port ${PORT} reusable`)
}

if (failures.length > 0) {
  throw new Error(`M9 guard-depth gate failed:\n- ${failures.join('\n- ')}`)
}
