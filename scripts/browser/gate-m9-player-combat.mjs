import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m9-player-combat'
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

async function syncPhysics(page, frames = 3) {
  await page.evaluate(async (count) => {
    for (let i = 0; i < count; i += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }, frames)
}

async function capturePhaseShot(page, attack, phase, path) {
  await page.evaluate(
    ({ attack: kind, phase: want }) => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) g.defeatEnemy(enemy.id)
      g.setPlayerPosition({ x: -10.2, y: 0.82, z: 3.1 })
      g.setPlayerFacing({ x: 0, z: -1 })
      const accepted = g.requestAttack({ x: 0, z: -1 }, kind)
      if (accepted?.accepted !== true) {
        throw new Error(`${kind} rejected ${JSON.stringify(accepted)}`)
      }
      for (let step = 0; step < 120; step += 1) {
        if (g.snapshot().combat.phase === want) {
          const hold = Math.max(1, Math.floor((g.snapshot().combat.phaseDurationSteps || 4) / 3))
          for (let stay = 0; stay < hold; stay += 1) {
            if (g.snapshot().combat.phase !== want) break
            g.advance(1)
          }
          return { phase: g.snapshot().combat.phase }
        }
        g.advance(1)
      }
      throw new Error(`timeout parking ${kind} on ${want}`)
    },
    { attack, phase },
  )
  await syncPhysics(page, 2)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.screenshot({ path, fullPage: false, timeout: 10_000 })
      return
    } catch (error) {
      if (attempt === 2) throw error
      await soak(page, 150)
    }
  }
}

let cleanupReport = null
await runOwnedBrowserGate({
  artifactDir: OUT,
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

    await capturePhaseShot(page, 'light', 'startup', `${OUT}/01-light-startup.png`)
    pass('light startup frame captured')
    await capturePhaseShot(page, 'light', 'active', `${OUT}/02-light-active.png`)
    pass('light active frame captured')
    await capturePhaseShot(page, 'light', 'recovery', `${OUT}/03-light-recovery.png`)
    pass('light recovery frame captured')
    await capturePhaseShot(page, 'heavy', 'startup', `${OUT}/04-heavy-startup.png`)
    pass('heavy startup frame captured')
    await capturePhaseShot(page, 'heavy', 'active', `${OUT}/05-heavy-active.png`)
    pass('heavy active frame captured')
    await capturePhaseShot(page, 'heavy', 'recovery', `${OUT}/06-heavy-recovery.png`)
    pass('heavy recovery frame captured')

    const notes = []

    // Timing + miss need no Rapier hurtbox sync.
    {
      const timing = await runProbe(page, () => {
        const g = window.__MOURNEVEIL_GATE__
        const out = []
        const light = g.requestAttack({ x: 0, z: 1 }, 'light')
        if (light?.accepted !== true) throw new Error('light rejected in empty space')
        let lightStartup = 0
        while (g.snapshot().combat.phase === 'startup') {
          lightStartup += 1
          g.advance(1)
        }
        while (g.snapshot().combat.phase !== 'idle') g.advance(1)
        const heavy = g.requestAttack({ x: 0, z: 1 }, 'heavy')
        if (heavy?.accepted !== true) throw new Error('heavy rejected in empty space')
        let heavyStartup = 0
        while (g.snapshot().combat.phase === 'startup') {
          heavyStartup += 1
          g.advance(1)
        }
        while (g.snapshot().combat.phase !== 'idle') g.advance(1)
        if (!(heavyStartup > lightStartup)) {
          throw new Error(`heavy startup ${heavyStartup} should exceed light ${lightStartup}`)
        }
        out.push(`heavy wind-up longer than light (${heavyStartup}>${lightStartup})`)

        g.resetMeleeFixture()
        g.restorePlayer()
        for (const enemy of g.snapshot().enemies) g.defeatEnemy(enemy.id)
        g.setPlayerPosition({ x: -14, y: 0.82, z: 6 })
        g.setPlayerFacing({ x: 0, z: -1 })
        const miss = g.requestAttack({ x: 0, z: -1 }, 'light')
        for (let step = 0; step < 50; step += 1) g.advance(1)
        if (g.snapshot().contact.lastHit !== null) {
          throw new Error(`miss produced hit ${JSON.stringify(g.snapshot().contact.lastHit)}`)
        }
        out.push(`miss produced no hit confirm (execution=${miss.executionId})`)
        return out
      })
      notes.push(...timing)
    }

    // Light hit: place → sync Rapier hurtboxes → attack (telegraph punish pattern).
    await runProbe(page, () => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.skirmisher.introduction') g.defeatEnemy(enemy.id)
      }
      const intro = g.snapshot().enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
      g.setPlayerPosition({
        x: intro.position.x,
        y: 0.82,
        z: intro.position.z - 0.75,
      })
      g.setPlayerFacing({ x: 0, z: 1 })
    })
    await syncPhysics(page, 5)
    {
      const lightHit = await runProbe(page, () => {
        const g = window.__MOURNEVEIL_GATE__
        const find = () =>
          g.snapshot().enemies.find((e) => e.id === 'enemy.skirmisher.introduction') ?? null
        g.restorePlayer()
        const intro = find()
        g.setPlayerPosition({
          x: intro.position.x,
          y: 0.82,
          z: intro.position.z - 0.75,
        })
        g.setPlayerFacing({ x: 0, z: 1 })
        const attack = g.requestAttack({ x: 0, z: 1 }, 'light')
        if (attack?.accepted !== true) {
          return { ok: false, reason: `rejected ${JSON.stringify(attack)}` }
        }
        let landed = null
        for (let step = 0; step < 40; step += 1) {
          g.advance(1)
          const last = g.snapshot().contact.lastHit
          if (
            last !== null &&
            last.actionId === 'player.attack.light' &&
            last.executionId === attack.executionId &&
            last.outcome === 'damaged'
          ) {
            landed = last
            break
          }
        }
        if (landed === null) {
          return {
            ok: false,
            reason: 'no hit',
            last: g.snapshot().contact.lastHit,
            combat: g.snapshot().combat,
          }
        }
        const hpAfterLight = find()?.health.current
        for (let step = 0; step < 20; step += 1) g.advance(1)
        if (find()?.health.current !== hpAfterLight) {
          return { ok: false, reason: 'duplicate light damage' }
        }
        while (g.snapshot().combat.phase !== 'idle') g.advance(1)
        g.requestAttack({ x: 0, z: 1 }, 'light')
        g.advance(3)
        const blocked = g.requestAttack({ x: 0, z: 1 }, 'heavy')
        if (blocked?.accepted !== false) {
          return { ok: false, reason: 'mash bypassed recovery' }
        }
        return { ok: true, executionId: attack.executionId, hpAfterLight }
      })
      if (!lightHit.ok) throw new Error(`light hit failed ${JSON.stringify(lightHit)}`)
      notes.push(`light hit confirm execution=${lightHit.executionId} hp=${lightHit.hpAfterLight}`)
      notes.push('same execution did not duplicate light damage')
      notes.push('attack recovery cannot be bypassed by mash')
    }

    // Heavy interrupt: pursue keeps Rapier synced during wait; brief sync before swing.
    await runProbe(page, () => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.skirmisher.introduction') g.defeatEnemy(enemy.id)
      }
      const place = () => {
        const intro = g.snapshot().enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
        g.setPlayerPosition({
          x: intro.position.x,
          y: 0.82,
          z: intro.position.z - 0.8,
        })
        g.setPlayerFacing({ x: 0, z: 1 })
      }
      place()
      for (let step = 0; step < 360; step += 1) {
        const enemy = g.snapshot().enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
        if (
          enemy &&
          enemy.alive &&
          enemy.state !== 'hitReaction' &&
          !(enemy.state === 'attack' && enemy.action.phase === 'active')
        ) {
          break
        }
        if (step % 8 === 0) {
          g.restorePlayer()
          place()
        }
        g.advance(1)
      }
      place()
    })
    await syncPhysics(page, 3)
    {
      const interrupt = await runProbe(page, () => {
        const g = window.__MOURNEVEIL_GATE__
        const find = () =>
          g.snapshot().enemies.find((e) => e.id === 'enemy.skirmisher.introduction') ?? null
        g.restorePlayer()
        const intro = find()
        g.setPlayerPosition({
          x: intro.position.x,
          y: 0.82,
          z: intro.position.z - 0.8,
        })
        g.setPlayerFacing({ x: 0, z: 1 })
        const attack = g.requestAttack({ x: 0, z: 1 }, 'heavy')
        for (let step = 0; step < 70; step += 1) {
          g.advance(1)
          if (find()?.state === 'hitReaction') {
            return { ok: true, executionId: attack.executionId }
          }
        }
        return { ok: false, state: find()?.state, last: g.snapshot().contact.lastHit }
      })
      if (!interrupt.ok) throw new Error(`skirmisher heavy interrupt failed ${JSON.stringify(interrupt)}`)
      notes.push(`skirmisher interrupted by heavy execution=${interrupt.executionId}`)
    }

    // Brute first/second heavy — one in-page probe after Rapier sync (quiet-meter safe).
    await runProbe(page, () => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.brute.1') g.defeatEnemy(enemy.id)
      }
      const place = () => {
        const brute = g.snapshot().enemies.find((e) => e.id === 'enemy.brute.1')
        g.setPlayerPosition({
          x: brute.position.x,
          y: 0.82,
          z: brute.position.z - 1.05,
        })
        g.setPlayerFacing({ x: 0, z: 1 })
      }
      place()
      for (let step = 0; step < 360; step += 1) {
        const enemy = g.snapshot().enemies.find((e) => e.id === 'enemy.brute.1')
        if (enemy?.alive && (enemy.state === 'recovery' || enemy.state === 'idle')) break
        if (step % 8 === 0) {
          g.restorePlayer()
          place()
        }
        g.advance(1)
      }
      place()
    })
    await syncPhysics(page, 5)
    {
      const brute = await runProbe(page, () => {
        const g = window.__MOURNEVEIL_GATE__
        const out = []
        const find = () => g.snapshot().enemies.find((e) => e.id === 'enemy.brute.1') ?? null
        const place = () => {
          const live = find()
          g.setPlayerPosition({
            x: live.position.x,
            y: 0.82,
            z: live.position.z - 1.05,
          })
          g.setPlayerFacing({ x: 0, z: 1 })
        }
        const waitPreferRecovery = () => {
          for (let step = 0; step < 360; step += 1) {
            const enemy = find()
            if (
              enemy?.alive &&
              ((enemy.state === 'recovery' &&
                (enemy.action?.phaseRemainingSteps ?? 48) >= 30) ||
                enemy.state === 'idle' ||
                (enemy.state === 'attack' &&
                  enemy.action.phase === 'startup' &&
                  enemy.action.phaseElapsedSteps <= 4))
            ) {
              return
            }
            if (step % 8 === 0) place()
            g.advance(1)
          }
          throw new Error('timeout interruptible brute')
        }
        const landHeavy = () => {
          g.restorePlayer()
          while (g.snapshot().combat.phase !== 'idle') g.advance(1)
          waitPreferRecovery()
          g.restorePlayer()
          place()
          const attack = g.requestAttack({ x: 0, z: 1 }, 'heavy')
          if (attack?.accepted !== true) {
            throw new Error(`heavy rejected ${JSON.stringify(attack)}`)
          }
          for (let step = 0; step < 70; step += 1) {
            g.advance(1)
            const enemy = find()
            const last = g.snapshot().contact.lastHit
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
        let first = null
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const result = landHeavy()
          if (result.enemy?.state === 'hitReaction') {
            throw new Error('brute reacted on first heavy')
          }
          if ((result.enemy?.interruptMeter ?? 0) >= 1) {
            first = result
            break
          }
        }
        if (first === null) {
          throw new Error(`brute meter never built last=${JSON.stringify(find())}`)
        }
        out.push(`brute resisted first heavy meter=${first.enemy.interruptMeter}`)

        let second = null
        for (let attempt = 0; attempt < 8; attempt += 1) {
          // Stay under interrupt quiet-reset (90 steps).
          for (let step = 0; step < 6; step += 1) g.advance(1)
          const result = landHeavy()
          if (result.enemy?.state === 'hitReaction') {
            second = result
            break
          }
        }
        if (second === null) {
          throw new Error(
            `brute second heavy failed state=${find()?.state} meter=${find()?.interruptMeter}`,
          )
        }
        out.push('brute interrupted on second heavy')
        return out
      })
      notes.push(...brute)
    }

    // Defeat transition.
    await runProbe(page, () => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== 'enemy.skirmisher.introduction') g.defeatEnemy(enemy.id)
      }
    })
    await syncPhysics(page, 3)
    {
      const defeat = await runProbe(page, () => {
        const g = window.__MOURNEVEIL_GATE__
        const find = () =>
          g.snapshot().enemies.find((e) => e.id === 'enemy.skirmisher.introduction') ?? null
        for (let attempt = 0; attempt < 8; attempt += 1) {
          while (g.snapshot().combat.phase !== 'idle') g.advance(1)
          g.restorePlayer()
          const intro = find()
          if (!intro?.alive) break
          g.setPlayerPosition({
            x: intro.position.x,
            y: 0.82,
            z: intro.position.z - 0.8,
          })
          g.setPlayerFacing({ x: 0, z: 1 })
          g.requestAttack({ x: 0, z: 1 }, 'heavy')
          for (let step = 0; step < 70; step += 1) g.advance(1)
        }
        return { alive: find()?.alive === true }
      })
      if (defeat.alive) throw new Error('failed to defeat introduction skirmisher')
      notes.push('defeated enemy transition observed')
    }

    for (const note of notes) pass(note)

    // Defense regressions under live rAF.
    await gate(page, 'resetMeleeFixture')
    await gate(page, 'restorePlayer')
    {
      const state = await snapshot(page)
      for (const enemy of state.enemies) {
        if (enemy.id !== 'enemy.skirmisher.introduction') await gate(page, 'defeatEnemy', enemy.id)
      }
    }
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
      const deadline = Date.now() + 20_000
      let guarded = false
      let broken = false
      while (Date.now() < deadline && !guarded) {
        const state = await snapshot(page)
        const intro = state.enemies.find((e) => e.id === 'enemy.skirmisher.introduction')
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
          broken = hit.outcome === 'guard-broken'
          pass(`guard interaction outcome=${hit.outcome}`)
        }
        await page.waitForTimeout(40)
      }
      if (!guarded) fail('guard did not register')
      if (broken) pass('guard break remains distinct')
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
  if (cleanupReport.artifactCleanup?.kept) {
  pass(`owned artifacts kept (KEEP_ARTIFACTS); port ${PORT} reusable`)
} else if (cleanupReport.artifactCleanup?.kept === false) {
  pass(`owned artifacts removed; port ${PORT} reusable`)
} else {
  fail(`artifact cleanup missing: ${JSON.stringify(cleanupReport.artifactCleanup)}`)
}
}

if (failures.length > 0) {
  console.error(`\n${failures.length} player-combat gate failure(s)`)
  process.exit(1)
}
console.log('\nM9 player-combat gate PASS')
