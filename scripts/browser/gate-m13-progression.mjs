import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m13-progression'
const PORT = 4209
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
    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await page.evaluate(() => {
      localStorage.removeItem('mourneveil.save.v4')
      localStorage.removeItem('mourneveil.save.v3')
      localStorage.removeItem('mourneveil.save.v2')
      localStorage.removeItem('mourneveil.save.v1')
    })
    await page.reload({ waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await soak(page, 800)

    const report = await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      const notes = []
      const VITALITY = 'item.charm.vitality'

      const pickup = () => {
        const loot = g.snapshot().lootPickup
        if (!loot.active || loot.position === null) throw new Error('loot missing')
        g.setPlayerPosition(loot.position)
        for (let step = 0; step < 8; step += 1) g.advance(1)
      }

      g.resetMeleeFixture()
      g.restorePlayer()
      const fresh = g.snapshot()
      if (fresh.progression.level !== 1 || fresh.progression.experience !== 0) {
        throw new Error(`fresh progression expected L1/0 got ${JSON.stringify(fresh.progression)}`)
      }
      if (fresh.playerHealth.health.maximum !== 100) {
        throw new Error(`fresh max HP expected 100 got ${fresh.playerHealth.health.maximum}`)
      }
      notes.push('1 fresh level-1 state')

      g.defeatEnemy('enemy.skirmisher.1')
      let snap = g.snapshot()
      if (snap.progression.experience !== 25) {
        throw new Error(`XP after skirmisher expected 25 got ${snap.progression.experience}`)
      }
      notes.push('2-3 defeat enemy + XP increases')

      g.defeatEnemy('enemy.skirmisher.pressure')
      snap = g.snapshot()
      if (snap.progression.level !== 2 || snap.progression.unspentPoints !== 1) {
        throw new Error(`level-up expected L2/1pt got L${snap.progression.level}/${snap.progression.unspentPoints}`)
      }
      notes.push('4-5 cross threshold + point available')

      const alloc = g.allocateProgression('vitality')
      if (alloc?.accepted !== true) throw new Error(`allocate failed: ${JSON.stringify(alloc)}`)
      snap = g.snapshot()
      if (snap.playerHealth.health.maximum !== 110) {
        throw new Error(`vitality allocation expected maxHP 110 got ${snap.playerHealth.health.maximum}`)
      }
      if (snap.progression.allocation.vitality !== 1 || snap.progression.unspentPoints !== 0) {
        throw new Error(`allocation state bad: ${JSON.stringify(snap.progression)}`)
      }
      notes.push('6-7 allocate vitality + authoritative max HP 110')

      g.defeatEnemy('enemy.brute.1')
      pickup()
      const equip = g.equipItem(VITALITY)
      if (equip?.accepted !== true) throw new Error(`equip vitality failed: ${JSON.stringify(equip)}`)
      snap = g.snapshot()
      if (snap.playerHealth.health.maximum !== 130) {
        throw new Error(`compose expected maxHP 130 got ${snap.playerHealth.health.maximum}`)
      }
      notes.push('8-9 equip vitality charm composes (+20)')

      const saved = g.snapshot()
      // Force persist via defeat already marked persistent; capture through reload path:
      // applySave is not on gate — use localStorage via page reload after writing from snapshot facts.
      // Gate proves in-session capture by defeating duplicate then checking XP unchanged, then death.
      const xpBefore = saved.progression.experience
      const levelBefore = saved.progression.level
      const allocBefore = { ...saved.progression.allocation }
      g.defeatEnemy('enemy.brute.1')
      if (g.snapshot().progression.experience !== xpBefore) {
        throw new Error('duplicate brute XP granted')
      }
      notes.push('no duplicate reward for already-defeated enemy')

      // Save/load through storage key used by the app
      const payload = {
        version: 4,
        activeCheckpointId: saved.checkpoint.currentCheckpointId,
        checkpointActivated: saved.checkpoint.activated,
        flaskCharges: saved.flask.currentCharges,
        echoesCarried: saved.echoes.carried,
        echoRecovery: {
          active: saved.echoRecovery.active,
          amount: saved.echoRecovery.amount,
          position: saved.echoRecovery.position,
        },
        inventory: saved.inventory.entries,
        equipment: {
          weaponItemId: saved.equipment.weaponItemId,
          charmItemId: saved.equipment.charmItemId,
        },
        lootPickup: {
          active: saved.lootPickup.active,
          instanceId: saved.lootPickup.instanceId,
          itemId: saved.lootPickup.itemId,
          position: saved.lootPickup.position,
          spawnedFromEnemyId: saved.lootPickup.spawnedFromEnemyId,
          spawnedFromEnemyIds: saved.lootPickup.spawnedFromEnemyIds,
        },
        world: {
          openedShortcutIds: saved.world.openedShortcutIds,
          finalGateReached: saved.world.finalGateReached,
          defeatedBossIds: saved.world.defeatedBossIds,
        },
        progression: {
          level: saved.progression.level,
          experience: saved.progression.experience,
          unspentPoints: saved.progression.unspentPoints,
          allocation: { ...saved.progression.allocation },
        },
        skills: {
          equippedSkillId: saved.skills.equippedSkillId,
        },
      }
      localStorage.setItem('mourneveil.save.v4', JSON.stringify(payload))
      notes.push('10 save written')

      return { notes, xpBefore, levelBefore, allocBefore, pageReload: true }
    })

    for (const note of report.notes) pass(note)

    await page.reload({ waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await soak(page, 800)

    const afterReload = await page.evaluate(({ xpBefore, levelBefore, allocBefore }) => {
      const g = window.__MOURNEVEIL_GATE__
      const snap = g.snapshot()
      if (snap.progression.experience !== xpBefore || snap.progression.level !== levelBefore) {
        throw new Error(
          `reload progression mismatch got ${JSON.stringify(snap.progression)} expected xp=${xpBefore} lv=${levelBefore}`,
        )
      }
      if (
        snap.progression.allocation.vitality !== allocBefore.vitality ||
        snap.progression.allocation.resolve !== allocBefore.resolve ||
        snap.progression.allocation.might !== allocBefore.might
      ) {
        throw new Error(`reload allocation mismatch ${JSON.stringify(snap.progression.allocation)}`)
      }
      if (snap.playerHealth.health.maximum !== 130) {
        throw new Error(`reload composed HP expected 130 got ${snap.playerHealth.health.maximum}`)
      }

      // Activate checkpoint then death/respawn preserves progression
      g.setPlayerPosition(snap.checkpoint.respawnPosition)
      g.interactCheckpoint()
      g.applyDamage(999)
      if (g.snapshot().playerHealth.lifeState !== 'dead') throw new Error('expected dead')
      const mid = g.snapshot().progression
      g.respawn()
      const after = g.snapshot().progression
      if (
        after.experience !== mid.experience ||
        after.level !== mid.level ||
        after.allocation.vitality !== mid.allocation.vitality
      ) {
        throw new Error('death/respawn altered progression')
      }
      return {
        progression: after,
        maxHp: g.snapshot().playerHealth.health.maximum,
      }
    }, report)

    pass('11-12 reload progression identical')
    pass(`13 death/respawn preserves progression (L${afterReload.progression.level}/XP ${afterReload.progression.experience})`)

    if (pageErrors.length > 0) fail(`page errors: ${pageErrors.join(' | ')}`)
    else pass('14 no page errors')

    await page.screenshot({ path: `${artifactDir}/m13-progression.png`, fullPage: true })

    if (failures.length > 0) {
      throw new Error(`M13 progression gate failed:\n- ${failures.join('\n- ')}`)
    }
    console.log('\nM13 progression gate PASS')
  },
})

if (cleanupReport?.artifactRemoved) {
  pass(`owned artifacts removed; port ${PORT} reusable`)
}
