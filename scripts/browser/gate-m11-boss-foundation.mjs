import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery } from './freshSession.mjs'

const OUT = 'tmp-m11-boss-foundation'
const PORT = 4205
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

async function runProbe(page, probe) {
  return page.evaluate(probe)
}

let cleanupReport = null
await runOwnedBrowserGate({
  artifactDir: OUT,
  port: PORT,
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl, artifactDir }) => {
    const pageErrors = []
    page.on('pageerror', (error) => {
      pageErrors.push(String(error))
      console.error(`PAGE ERROR: ${error}`)
    })
    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await soak(page, 1000)

    const report = await runProbe(page, () => {
      const g = window.__MOURNEVEIL_GATE__
      const notes = []
      const BOSS_ID = 'enemy.boss.sepulchre.1'
      const find = (id) => g.snapshot().enemies.find((enemy) => enemy.id === id) ?? null

      g.resetMeleeFixture()
      g.restorePlayer()
      g.setPlayerPosition({ x: -6.4, y: 0.82, z: 0 })
      g.interactCheckpoint()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id !== BOSS_ID) g.defeatEnemy(enemy.id)
      }

      g.setPlayerPosition({ x: 13, y: 0.82, z: -2.2 })
      g.setPlayerFacing({ x: 0, z: -1 })
      for (let step = 0; step < 30; step += 1) g.advance(1)

      let boss = find(BOSS_ID)
      if (!boss?.alive) throw new Error('boss missing/alive expected after arena entry')
      notes.push(`boss present state=${boss.state} hp=${boss.health.current}`)

      // Wait for activation + attack commitment.
      let attacked = false
      for (let step = 0; step < 240; step += 1) {
        g.advance(1)
        boss = find(BOSS_ID)
        if (boss?.state === 'attack' || boss?.state === 'recovery') {
          attacked = true
          break
        }
      }
      if (!attacked) throw new Error(`boss never attacked (state=${boss?.state})`)
      notes.push(`boss attacked action=${boss.action.actionId} phase=${boss.action.phase}`)

      // Damage into phase 2 while keeping the player alive.
      const max = boss.health.maximum
      for (let attempt = 0; attempt < 40; attempt += 1) {
        g.restorePlayer()
        boss = find(BOSS_ID)
        if (!boss?.alive) throw new Error('boss died before phase-2 probe')
        if (boss.health.current / max <= 0.45) break
        while (g.snapshot().combat.phase !== 'idle') g.advance(1)
        // Wait for an interruptible boss window when possible.
        for (let step = 0; step < 90; step += 1) {
          g.advance(1)
          boss = find(BOSS_ID)
          if (
            boss &&
            boss.state !== 'attack' &&
            !(boss.state === 'attack' && boss.action.phase === 'active')
          ) {
            break
          }
        }
        const aim = { x: 0, z: -1 }
        g.setPlayerPosition({
          x: find(BOSS_ID).position.x,
          y: 0.82,
          z: find(BOSS_ID).position.z + 1.15,
        })
        g.setPlayerFacing(aim)
        const attack = g.requestAttack(aim, 'heavy')
        if (attack?.accepted === false) {
          g.restorePlayer()
          continue
        }
        for (let step = 0; step < 70; step += 1) g.advance(1)
        g.restorePlayer()
      }
      boss = find(BOSS_ID)
      const phase2 = boss.health.current / boss.health.maximum <= 0.5
      if (!phase2) throw new Error(`expected phase-2 hp ratio, got ${boss.health.current}/${max}`)
      notes.push(`phase2 hp=${boss.health.current}/${max}`)

      // Guard/dodge smoke: soak one boss contact window if it arrives.
      g.restorePlayer()
      let defenseNoted = false
      for (let attempt = 0; attempt < 6; attempt += 1) {
        g.restorePlayer()
        boss = find(BOSS_ID)
        g.setPlayerPosition({
          x: boss.position.x,
          y: 0.82,
          z: boss.position.z + 1.15,
        })
        g.setPlayerFacing({ x: 0, z: -1 })
        const beforeHp = g.snapshot().playerHealth.health.current
        for (let step = 0; step < 120; step += 1) {
          g.advance(1)
          const after = g.snapshot()
          if (
            after.incomingContact?.lastHit?.outcome === 'guarded' ||
            after.incomingContact?.lastHit?.outcome === 'guard-broken' ||
            after.incomingContact?.lastHit?.outcome === 'dodged' ||
            after.playerHealth.health.current < beforeHp
          ) {
            defenseNoted = true
            notes.push(
              `defense interaction outcome=${after.incomingContact?.lastHit?.outcome ?? 'damaged'} hp ${beforeHp}->${after.playerHealth.health.current}`,
            )
            break
          }
        }
        if (defenseNoted) break
      }
      if (!defenseNoted) {
        notes.push('defense interaction not observed this run (non-fatal)')
      }

      g.restorePlayer()
      g.defeatEnemy(BOSS_ID)
      if (find(BOSS_ID)?.alive) throw new Error('boss still alive after defeat')
      notes.push('boss defeated')

      if (!g.snapshot().world.defeatedBossIds.includes('boss.veilbound-sepulchre')) {
        throw new Error('defeatedBossIds missing technical boss id')
      }
      notes.push('defeatedBossIds persisted in world snapshot')

      // Player death/reset keeps boss defeated.
      g.applyDamage(999)
      g.respawn()
      if (find(BOSS_ID)?.alive) throw new Error('boss revived after player respawn')
      notes.push('boss remained defeated after player death/respawn')

      const stats = g.rendererStats?.() ?? null
      return { notes, stats, bossFinal: find(BOSS_ID) }
    })

    for (const note of report.notes) pass(note)
    if (report.stats) {
      pass(
        `renderer stats drawCalls=${report.stats.drawCalls} triangles=${report.stats.triangles} meshes=${report.stats.meshes} lights=${report.stats.lights}`,
      )
    }

    await page.screenshot({
      path: `${artifactDir}/01-boss-arena.png`,
      fullPage: false,
    })
    pass('boss arena screenshot captured')

    if (pageErrors.length > 0) fail(`uncaught page errors: ${pageErrors.join(' | ')}`)
    else pass('no uncaught page errors')

    if (failures.length > 0) {
      throw new Error(`${failures.length} m11 boss-foundation gate failure(s)`)
    }
  },
})

if (cleanupReport?.artifactDirRemoved === false && process.env.KEEP_ARTIFACTS !== '1') {
  console.error('FAIL: artifact dir not cleaned')
  process.exit(1)
}
pass(`owned artifacts ${process.env.KEEP_ARTIFACTS === '1' ? 'kept' : 'removed'}; port ${PORT} reusable`)
console.log('\nM11 boss-foundation gate PASS')
