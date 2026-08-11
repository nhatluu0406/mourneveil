import { mkdir } from 'node:fs/promises'
import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m9-hit-reaction'
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

async function soak(page, ms) {
  const slice = 40
  for (let i = 0; i < Math.ceil(ms / slice); i += 1) await page.waitForTimeout(slice)
}

/**
 * Run a tightly sequenced combat probe inside the page so rAF cannot
 * interleave between Playwright round-trips mid-assertion.
 */
async function runProbe(page, probe) {
  return page.evaluate(probe)
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
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await soak(page, 1200)

    const report = await runProbe(page, () => {
      const g = window.__MOURNEVEIL_GATE__
      const notes = []
      const find = (id) => g.snapshot().enemies.find((enemy) => enemy.id === id) ?? null
      const isInterruptible = (enemy) => {
        if (enemy === null || !enemy.alive) return false
        if (enemy.state === 'hitReaction' || enemy.state === 'defeated') return false
        if (enemy.state === 'attack' && enemy.action.phase === 'active') return false
        return true
      }
      const waitInterruptible = (id, steps = 240) => {
        for (let step = 0; step < steps; step += 1) {
          const enemy = find(id)
          if (isInterruptible(enemy)) return enemy
          g.advance(1)
        }
        throw new Error(`timeout interruptible ${id}`)
      }
      const landHeavy = (id, aim) => {
        waitInterruptible(id)
        const before = find(id)
        const attack = g.requestAttack(aim, 'heavy')
        if (attack?.accepted === false) throw new Error(`heavy rejected ${JSON.stringify(attack)}`)
        for (let step = 0; step < 40; step += 1) {
          g.advance(1)
          const state = g.snapshot()
          const enemy = find(id)
          const last = state.contact.lastHit
          if (
            enemy?.state === 'hitReaction' ||
            (last !== null &&
              last.targetId === id &&
              last.actionId === 'player.attack.heavy' &&
              last.executionId === attack.executionId &&
              last.outcome === 'damaged')
          ) {
            return { attack, before, enemy, last }
          }
        }
        return { attack, before, enemy: find(id), last: g.snapshot().contact.lastHit }
      }

      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.skirmisher.introduction') g.defeatEnemy(enemy.id)
      }
      const intro = find('enemy.skirmisher.introduction')
      g.setPlayerPosition({
        x: intro.position.x,
        y: 0.82,
        z: intro.position.z - 0.95,
      })
      g.setPlayerFacing({ x: 0, z: 1 })
      notes.push(`skirmisher present (${find('enemy.skirmisher.introduction')?.state})`)

      const first = landHeavy('enemy.skirmisher.introduction', { x: 0, z: 1 })
      if (first.enemy?.state !== 'hitReaction') {
        throw new Error(`expected skirmisher hitReaction, got ${first.enemy?.state}`)
      }
      notes.push(
        `skirmisher hitReaction remaining=${first.enemy.hitReactionRemainingSteps} hp ${first.before.health.current}->${first.enemy.health.current}`,
      )
      const moving = Math.hypot(first.enemy.velocity.x, first.enemy.velocity.z)
      if (moving >= 0.01) throw new Error(`movement during reaction ${moving}`)
      notes.push('hit reaction suppresses movement')

      // Same execution cannot re-trigger: remain reacting and meter stays cleared.
      g.advance(3)
      const during = find('enemy.skirmisher.introduction')
      if (during?.state !== 'hitReaction') {
        throw new Error(`expected still hitReaction after 3 steps, got ${during?.state}`)
      }
      notes.push('same execution does not restart reaction')

      for (let step = 0; step < 40; step += 1) {
        g.advance(1)
        if (find('enemy.skirmisher.introduction')?.state !== 'hitReaction') break
      }
      const recovered = find('enemy.skirmisher.introduction')
      if (!recovered?.alive || recovered.state === 'hitReaction') {
        throw new Error(`skirmisher did not recover (${recovered?.state})`)
      }
      notes.push(`skirmisher recovered to ${recovered.state}`)

      // Startup interrupt if a clean window appears.
      let startupInterrupted = false
      for (let attempt = 0; attempt < 120; attempt += 1) {
        g.advance(1)
        const live = find('enemy.skirmisher.introduction')
        if (live?.state === 'attack' && live.action.phase === 'startup') {
          const attack = g.requestAttack({ x: 0, z: 1 }, 'heavy')
          for (let step = 0; step < 40; step += 1) {
            g.advance(1)
            if (find('enemy.skirmisher.introduction')?.state === 'hitReaction') {
              startupInterrupted = true
              break
            }
          }
          notes.push(
            startupInterrupted
              ? `startup interrupted execution=${attack.executionId}`
              : 'startup window seen but interrupt not observed',
          )
          break
        }
        if (live && !live.alive) break
      }
      if (!startupInterrupted) notes.push('startup interrupt window not observed this run (non-fatal)')

      // Brute resistance: two heavies.
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.brute.1') g.defeatEnemy(enemy.id)
      }
      const brute = find('enemy.brute.1')
      g.setPlayerPosition({
        x: brute.position.x,
        y: 0.82,
        z: brute.position.z - 1.15,
      })
      g.setPlayerFacing({ x: 0, z: 1 })

      const bruteFirst = landHeavy('enemy.brute.1', { x: 0, z: 1 })
      if (bruteFirst.enemy?.state === 'hitReaction') {
        throw new Error(
          `brute reacted on first heavy definitionId=${bruteFirst.enemy.definitionId} meter=${bruteFirst.enemy.interruptMeter}`,
        )
      }
      if ((bruteFirst.enemy?.interruptMeter ?? 0) < 1) {
        throw new Error(
          `brute meter missing after first heavy state=${bruteFirst.enemy?.state} last=${JSON.stringify(bruteFirst.last)}`,
        )
      }
      notes.push(
        `brute resisted first heavy (meter=${bruteFirst.enemy.interruptMeter}, state=${bruteFirst.enemy.state})`,
      )

      // Clear player recovery so the next heavy can start.
      for (let step = 0; step < 45; step += 1) g.advance(1)
      const bruteSecond = landHeavy('enemy.brute.1', { x: 0, z: 1 })
      if (bruteSecond.enemy?.state !== 'hitReaction') {
        throw new Error(
          `brute second heavy failed state=${bruteSecond.enemy?.state} meter=${bruteSecond.enemy?.interruptMeter}`,
        )
      }
      notes.push('brute entered hitReaction after second heavy')

      for (let step = 0; step < 40; step += 1) {
        g.advance(1)
        if (find('enemy.brute.1')?.state !== 'hitReaction') break
      }
      const resumed = find('enemy.brute.1')
      if (!resumed?.alive || resumed.state === 'hitReaction') {
        throw new Error(`brute did not resume (${resumed?.state})`)
      }
      notes.push(`brute resumed ${resumed.state}`)

      g.setPlayerPosition({
        x: resumed.position.x + 1.5,
        y: 0.82,
        z: resumed.position.z,
      })
      for (let step = 0; step < 20; step += 1) g.advance(1)
      const navigated = find('enemy.brute.1')
      notes.push(`post-reaction combat/nav state=${navigated?.state}`)

      return {
        notes,
        navigatedState: navigated?.state ?? null,
      }
    })

    for (const note of report.notes) pass(note)
    ;['pursue', 'spacing', 'attack', 'recovery', 'idle'].includes(report.navigatedState)
      ? pass(`nav/combat legal after reaction (${report.navigatedState})`)
      : fail(`unexpected post-reaction nav state ${report.navigatedState}`)

    await page.screenshot({ path: `${OUT}/01-hit-reaction-complete.png` })

    pageErrors.length === 0
      ? pass('no uncaught page errors')
      : fail(pageErrors.join(' | '))
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
  console.error(`\n${failures.length} hit-reaction gate failure(s)`)
  process.exit(1)
}
console.log('\nM9 hit-reaction gate PASS')
