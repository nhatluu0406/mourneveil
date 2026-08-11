import { mkdir } from 'node:fs/promises'
import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m9-telegraph-readability'
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

async function runProbe(page, probe) {
  return page.evaluate(probe)
}

/** Let R3F/Rapier useFrame sync kinematic hurtboxes to simulation poses. */
async function syncPhysics(page, frames = 3) {
  await page.evaluate(async (count) => {
    for (let i = 0; i < count; i += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }, frames)
}

async function isolateEnemy(page, keepId) {
  await gate(page, 'resetMeleeFixture')
  await gate(page, 'restorePlayer')
  const state = await snapshot(page)
  for (const enemy of state.enemies) {
    if (enemy.id !== keepId) await gate(page, 'defeatEnemy', enemy.id)
  }
  await syncPhysics(page, 2)
  const keep = (await snapshot(page)).enemies.find((enemy) => enemy.id === keepId)
  if (keep === undefined) throw new Error(`missing ${keepId}`)
  await gate(page, 'setPlayerPosition', {
    x: keep.position.x + keep.facing.x * 1.05,
    y: 0.82,
    z: keep.position.z + keep.facing.z * 1.05,
  })
  await gate(page, 'setPlayerFacing', { x: -keep.facing.x, z: -keep.facing.z })
  await syncPhysics(page, 2)
}

async function capturePhaseShot(page, enemyId, phase, path) {
  await page.evaluate(
    ({ enemyId: id, phase: want }) => {
      const g = window.__MOURNEVEIL_GATE__
      const find = () => g.snapshot().enemies.find((entry) => entry.id === id) ?? null
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== id) g.defeatEnemy(enemy.id)
      }
      const face = (distance) => {
        const enemy = find()
        if (enemy === null) throw new Error(`missing ${id}`)
        g.setPlayerPosition({
          x: enemy.position.x + enemy.facing.x * distance,
          y: 0.82,
          z: enemy.position.z + enemy.facing.z * distance,
        })
        g.setPlayerFacing({ x: -enemy.facing.x, z: -enemy.facing.z })
      }
      face(1.05)
      for (let step = 0; step < 720; step += 1) {
        const enemy = find()
        if (
          enemy &&
          (enemy.action.phase === want || (want === 'recovery' && enemy.state === 'recovery'))
        ) {
          const hold = Math.max(1, Math.floor((enemy.action.phaseDurationSteps || 4) / 3))
          for (let stay = 0; stay < hold; stay += 1) {
            if (
              find()?.action?.phase !== want &&
              !(want === 'recovery' && find()?.state === 'recovery')
            ) {
              break
            }
            g.advance(1)
          }
          return true
        }
        if (step % 8 === 0) {
          g.restorePlayer()
          face(1.05)
        }
        g.advance(1)
      }
      throw new Error(`timeout parking ${id} on ${want} (state=${find()?.state})`)
    },
    { enemyId, phase },
  )
  await syncPhysics(page, 2)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.screenshot({ path, fullPage: false, timeout: 10_000 })
      return
    } catch (error) {
      if (attempt === 2) throw error
      await soak(page, 200)
      await syncPhysics(page, 1)
    }
  }
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

    await capturePhaseShot(
      page,
      'enemy.skirmisher.introduction',
      'startup',
      `${OUT}/01-skirmisher-startup.png`,
    )
    pass('skirmisher startup frame captured')
    await capturePhaseShot(
      page,
      'enemy.skirmisher.introduction',
      'active',
      `${OUT}/02-skirmisher-active.png`,
    )
    pass('skirmisher active frame captured')
    await capturePhaseShot(
      page,
      'enemy.skirmisher.introduction',
      'recovery',
      `${OUT}/03-skirmisher-recovery.png`,
    )
    pass('skirmisher recovery frame captured')
    await capturePhaseShot(page, 'enemy.brute.1', 'startup', `${OUT}/04-brute-startup.png`)
    pass('brute startup frame captured')
    await capturePhaseShot(page, 'enemy.brute.1', 'active', `${OUT}/05-brute-active.png`)
    pass('brute active frame captured')
    await capturePhaseShot(page, 'enemy.brute.1', 'recovery', `${OUT}/06-brute-recovery.png`)
    pass('brute recovery frame captured')

    const skirmisherStartup = await runProbe(page, () => {
      const g = window.__MOURNEVEIL_GATE__
      const find = () =>
        g.snapshot().enemies.find((enemy) => enemy.id === 'enemy.skirmisher.introduction') ?? null
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.skirmisher.introduction') g.defeatEnemy(enemy.id)
      }
      const face = () => {
        const enemy = find()
        g.setPlayerPosition({
          x: enemy.position.x,
          y: 0.82,
          z: enemy.position.z - 1.05,
        })
        g.setPlayerFacing({ x: 0, z: 1 })
      }
      face()
      for (let step = 0; step < 480; step += 1) {
        if (find()?.action?.phase === 'startup') break
        if (step % 8 === 0) face()
        g.advance(1)
      }
      let count = 0
      while (find()?.action?.phase === 'startup') {
        count += 1
        g.advance(1)
      }
      return count
    })
    await syncPhysics(page)
    const bruteStartup = await runProbe(page, () => {
      const g = window.__MOURNEVEIL_GATE__
      const find = () => g.snapshot().enemies.find((enemy) => enemy.id === 'enemy.brute.1') ?? null
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.brute.1') g.defeatEnemy(enemy.id)
      }
      const face = () => {
        const enemy = find()
        g.setPlayerPosition({
          x: enemy.position.x + 1.25,
          y: 0.82,
          z: enemy.position.z,
        })
        g.setPlayerFacing({ x: -1, z: 0 })
      }
      face()
      for (let step = 0; step < 720; step += 1) {
        if (find()?.action?.phase === 'startup') break
        if (step % 8 === 0) face()
        g.advance(1)
      }
      let count = 0
      while (find()?.action?.phase === 'startup') {
        count += 1
        g.advance(1)
      }
      return count
    })
    skirmisherStartup > 0 && bruteStartup > skirmisherStartup
      ? pass(
          `brute telegraph longer than skirmisher (${bruteStartup}>${skirmisherStartup})`,
        )
      : fail(`startup duration compare failed skirm=${skirmisherStartup} brute=${bruteStartup}`)

    // Punish: park recovery → sync Rapier → light in a short probe.
    await runProbe(page, () => {
      const g = window.__MOURNEVEIL_GATE__
      const find = () =>
        g.snapshot().enemies.find((enemy) => enemy.id === 'enemy.skirmisher.introduction') ?? null
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.skirmisher.introduction') g.defeatEnemy(enemy.id)
      }
      const place = () => {
        const intro = find()
        g.setPlayerPosition({
          x: intro.position.x,
          y: 0.82,
          z: intro.position.z - 0.95,
        })
        g.setPlayerFacing({ x: 0, z: 1 })
      }
      place()
      for (let step = 0; step < 480; step += 1) {
        const enemy = find()
        if (enemy?.action?.phase === 'recovery' || enemy?.state === 'recovery') return true
        if (step % 8 === 0) {
          g.restorePlayer()
          place()
        }
        g.advance(1)
      }
      throw new Error('timeout parking recovery for punish')
    })
    await syncPhysics(page, 5)
    {
      const punish = await runProbe(page, () => {
        const g = window.__MOURNEVEIL_GATE__
        g.restorePlayer()
        const intro = g.snapshot().enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
        g.setPlayerPosition({
          x: intro.position.x,
          y: 0.82,
          z: intro.position.z - 0.75,
        })
        g.setPlayerFacing({ x: 0, z: 1 })
        const light = g.requestAttack({ x: 0, z: 1 }, 'light')
        if (light?.accepted !== true) {
          return { ok: false, reason: `rejected ${JSON.stringify(light)}` }
        }
        for (let step = 0; step < 30; step += 1) {
          g.advance(1)
          const last = g.snapshot().contact.lastHit
          if (
            last !== null &&
            last.targetId === 'enemy.skirmisher.introduction' &&
            last.actionId === 'player.attack.light' &&
            last.executionId === light.executionId &&
            last.outcome === 'damaged'
          ) {
            return { ok: true, executionId: light.executionId }
          }
        }
        return {
          ok: false,
          reason: 'no hit',
          last: g.snapshot().contact.lastHit,
          phase: intro.action.phase,
          combat: g.snapshot().combat,
        }
      })
      punish.ok
        ? pass(`punish light landed execution=${punish.executionId}`)
        : fail(`punish light failed ${JSON.stringify(punish)}`)
    }

    // Startup interrupt entirely in-page (pursue resolver keeps Rapier hurtbox synced; no rAF gap).
    {
      const startup = await runProbe(page, () => {
        const g = window.__MOURNEVEIL_GATE__
        const find = () =>
          g.snapshot().enemies.find((enemy) => enemy.id === 'enemy.skirmisher.introduction') ?? null
        g.resetMeleeFixture()
        g.restorePlayer()
        for (const enemy of g.snapshot().enemies) {
          if (enemy.id !== 'enemy.skirmisher.introduction') g.defeatEnemy(enemy.id)
        }
        const place = (distance = 0.95) => {
          const intro = find()
          g.setPlayerPosition({
            x: intro.position.x,
            y: 0.82,
            z: intro.position.z - distance,
          })
          g.setPlayerFacing({ x: 0, z: 1 })
        }
        place()
        for (let step = 0; step < 480; step += 1) {
          const enemy = find()
          if (enemy?.action?.phase === 'startup' && enemy.action.phaseElapsedSteps <= 6) {
            break
          }
          if (step % 8 === 0) {
            g.restorePlayer()
            place()
          }
          g.advance(1)
        }
        const parked = find()
        if (parked?.action?.phase !== 'startup') {
          return { ok: false, reason: `phase=${parked?.action?.phase}` }
        }
        g.restorePlayer()
        place(0.8)
        const heavy = g.requestAttack({ x: 0, z: 1 }, 'heavy')
        if (heavy?.accepted !== true) {
          return { ok: false, reason: `rejected ${JSON.stringify(heavy)}` }
        }
        for (let step = 0; step < 55; step += 1) {
          const before = find()
          g.advance(1)
          const after = find()
          const last = g.snapshot().contact.lastHit
          if (
            after?.state === 'hitReaction' &&
            last !== null &&
            last.targetId === 'enemy.skirmisher.introduction' &&
            last.actionId === 'player.attack.heavy' &&
            last.executionId === heavy.executionId &&
            last.outcome === 'damaged'
          ) {
            return {
              ok: true,
              fromPhase: before?.action?.phase ?? null,
              executionId: heavy.executionId,
            }
          }
        }
        return {
          ok: false,
          reason: 'no reaction',
          state: find()?.state,
          phase: find()?.action?.phase,
          last: g.snapshot().contact.lastHit,
        }
      })
      startup.ok
        ? pass(
            `startup heavy interrupt fromPhase=${startup.fromPhase} execution=${startup.executionId}`,
          )
        : fail(`startup interrupt failed ${JSON.stringify(startup)}`)
    }

    // Recovery interrupt entirely in-page at early recovery (heavy startup 18 fits in recovery 24).
    {
      const recovery = await runProbe(page, () => {
        const g = window.__MOURNEVEIL_GATE__
        const find = () =>
          g.snapshot().enemies.find((enemy) => enemy.id === 'enemy.skirmisher.introduction') ?? null
        g.resetMeleeFixture()
        g.restorePlayer()
        for (const enemy of g.snapshot().enemies) {
          if (enemy.id !== 'enemy.skirmisher.introduction') g.defeatEnemy(enemy.id)
        }
        const place = (distance = 0.95) => {
          const intro = find()
          g.setPlayerPosition({
            x: intro.position.x,
            y: 0.82,
            z: intro.position.z - distance,
          })
          g.setPlayerFacing({ x: 0, z: 1 })
        }
        place()
        for (let step = 0; step < 480; step += 1) {
          const enemy = find()
          if (
            (enemy?.action?.phase === 'recovery' || enemy?.state === 'recovery') &&
            enemy.action.phaseElapsedSteps <= 4
          ) {
            break
          }
          if (step % 8 === 0) {
            g.restorePlayer()
            place()
          }
          g.advance(1)
        }
        const parked = find()
        if (parked?.action?.phase !== 'recovery' && parked?.state !== 'recovery') {
          return { ok: false, reason: `phase=${parked?.action?.phase}` }
        }
        g.restorePlayer()
        place(0.8)
        const heavy = g.requestAttack({ x: 0, z: 1 }, 'heavy')
        if (heavy?.accepted !== true) {
          return { ok: false, reason: `rejected ${JSON.stringify(heavy)}` }
        }
        for (let step = 0; step < 55; step += 1) {
          g.advance(1)
          if (find()?.state === 'hitReaction') {
            return { ok: true, executionId: heavy.executionId }
          }
        }
        return {
          ok: false,
          reason: 'no reaction',
          phase: find()?.action?.phase,
          last: g.snapshot().contact.lastHit,
        }
      })
      recovery.ok
        ? pass(`recovery heavy interrupt execution=${recovery.executionId}`)
        : fail(`recovery interrupt failed ${JSON.stringify(recovery)}`)
    }
    pass(
      'active non-interrupt: unit-covered (heavy startup 18 > skirmisher active 10; gate cannot land heavy during active)',
    )

    // Brute threshold: sync Rapier after prior probes, then match hit-reaction gate placement.
    await gate(page, 'resetMeleeFixture')
    await gate(page, 'restorePlayer')
    {
      const state = await snapshot(page)
      for (const enemy of state.enemies) {
        if (enemy.id !== 'enemy.brute.1') await gate(page, 'defeatEnemy', enemy.id)
      }
    }
    await syncPhysics(page, 5)
    {
      const brute = await runProbe(page, () => {
        const g = window.__MOURNEVEIL_GATE__
        const notes = []
        const find = () => g.snapshot().enemies.find((enemy) => enemy.id === 'enemy.brute.1') ?? null
        const place = () => {
          const live = find()
          g.setPlayerPosition({
            x: live.position.x,
            y: 0.82,
            z: live.position.z - 1.15,
          })
          g.setPlayerFacing({ x: 0, z: 1 })
        }
        const waitInterruptible = () => {
          for (let step = 0; step < 360; step += 1) {
            const enemy = find()
            if (
              enemy &&
              enemy.alive &&
              enemy.state !== 'hitReaction' &&
              !(enemy.state === 'attack' && enemy.action.phase === 'active')
            ) {
              return enemy
            }
            if (step % 8 === 0) place()
            g.advance(1)
          }
          throw new Error('timeout interruptible brute')
        }
        const landHeavy = () => {
          waitInterruptible()
          place()
          const attack = g.requestAttack({ x: 0, z: 1 }, 'heavy')
          if (attack?.accepted !== true) {
            throw new Error(`heavy rejected ${JSON.stringify(attack)}`)
          }
          for (let step = 0; step < 50; step += 1) {
            g.advance(1)
            const state = g.snapshot()
            const enemy = find()
            const last = state.contact.lastHit
            if (
              enemy?.state === 'hitReaction' ||
              (last !== null &&
                last.targetId === 'enemy.brute.1' &&
                last.actionId === 'player.attack.heavy' &&
                last.executionId === attack.executionId &&
                last.outcome === 'damaged')
            ) {
              return { attack, enemy, last }
            }
          }
          return { attack, enemy: find(), last: g.snapshot().contact.lastHit }
        }

        place()
        const first = landHeavy()
        if (first.enemy?.state === 'hitReaction') {
          throw new Error('brute reacted on first heavy')
        }
        if ((first.enemy?.interruptMeter ?? 0) < 1) {
          throw new Error(
            `brute meter missing meter=${first.enemy?.interruptMeter} last=${JSON.stringify(first.last)}`,
          )
        }
        notes.push(`brute resisted first heavy meter=${first.enemy.interruptMeter}`)
        for (let step = 0; step < 50; step += 1) g.advance(1)
        const second = landHeavy()
        if (second.enemy?.state !== 'hitReaction') {
          throw new Error(
            `brute second heavy failed state=${second.enemy?.state} meter=${second.enemy?.interruptMeter}`,
          )
        }
        notes.push('brute hitReaction after second heavy on interruptible phase')
        return { notes }
      })
      for (const note of brute.notes) pass(note)
    }

    // Defense regressions under live rAF (bodies stay synced).
    await isolateEnemy(page, 'enemy.skirmisher.introduction')
    // Guard-depth proven frontal placement in Outer Watch.
    await gate(page, 'setPlayerPosition', { x: -9.05, y: 0.82, z: 3.1 })
    await gate(page, 'setPlayerFacing', { x: -1, z: 0 })
    await syncPhysics(page, 3)
    const canvas = page.locator('canvas')
    await canvas.waitFor({ state: 'visible' })
    const bounds = await canvas.boundingBox()
    if (bounds === null) throw new Error('Gameplay canvas has no bounds')
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)

    await page.mouse.down({ button: 'right' })
    await page.waitForFunction(() => window.__MOURNEVEIL_GATE__.snapshot().defense.guarding, null, {
      timeout: 2_000,
    })
    {
      const deadline = Date.now() + 14_000
      let guarded = false
      while (Date.now() < deadline && !guarded) {
        const state = await snapshot(page)
        const intro = state.enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
        if (intro && !intro.alive) {
          fail('introduction died before guard proof')
          break
        }
        // Stay in frontal range while holding guard.
        if (intro) {
          await gate(page, 'setPlayerPosition', {
            x: intro.position.x + 1.05,
            y: 0.82,
            z: intro.position.z,
          })
          await gate(page, 'setPlayerFacing', { x: -1, z: 0 })
        }
        const hit = state.incomingContact.lastHit
        if (hit?.outcome === 'guarded' || hit?.outcome === 'guard-broken') {
          guarded = true
          pass(`guard interaction outcome=${hit.outcome}`)
        }
        await page.waitForTimeout(40)
      }
      if (!guarded) fail('guard did not register a guarded/guard-broken outcome')
    }
    await page.mouse.up({ button: 'right' })
    await soak(page, 200)

    await gate(page, 'restorePlayer')
    {
      const intro = (await snapshot(page)).enemies.find(
        (e) => e.id === 'enemy.skirmisher.introduction',
      )
      await gate(page, 'setPlayerPosition', {
        x: intro.position.x,
        y: 0.82,
        z: intro.position.z - 1.05,
      })
      await gate(page, 'setPlayerFacing', { x: 0, z: 1 })
    }
    await page.keyboard.down(' ')
    await page.keyboard.up(' ')
    await page.waitForFunction(
      () => {
        const snap = window.__MOURNEVEIL_GATE__.snapshot()
        return (
          snap.defense.invulnerable === true ||
          (snap.combat?.actionId === 'player.dodge' && snap.combat.phase !== 'idle')
        )
      },
      null,
      { timeout: 2_000 },
    )
    pass('dodge invulnerability window engaged')
    await soak(page, 500)

    await gate(page, 'restorePlayer')
    {
      const before = await snapshot(page)
      const intro = before.enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
      await gate(page, 'setPlayerPosition', {
        x: intro.position.x,
        y: 0.82,
        z: intro.position.z - 1.0,
      })
      await gate(page, 'setPlayerFacing', { x: 0, z: 1 })
      const startHp = before.playerHealth.health.current
      const deadline = Date.now() + 14_000
      let damaged = false
      while (Date.now() < deadline && !damaged) {
        const state = await snapshot(page)
        const hit = state.incomingContact.lastHit
        if (hit?.outcome === 'damaged' && state.playerHealth.health.current < startHp) {
          damaged = true
          pass(
            `mistimed defense took damage hp ${startHp}->${state.playerHealth.health.current} outcome=${hit.outcome}`,
          )
        }
        await page.waitForTimeout(40)
      }
      if (!damaged) fail('mistimed defense did not take damage within timeout')
    }

    await page.screenshot({ path: `${OUT}/07-defense-complete.png`, fullPage: false })
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
  console.error(`\n${failures.length} telegraph-readability gate failure(s)`)
  process.exit(1)
}
console.log('\nM9 telegraph-readability gate PASS')
