import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery, continueExistingSession } from './freshSession.mjs'

const OUT = 'tmp-m14-loot-journey'
const PORT = 4215
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

const FIRST_RUN = [
  'item.charm.vitality',
  'item.weapon.oathblade',
  'item.weapon.gravebrand',
  'item.charm.oathbrand-ember',
  'item.charm.ward-seal',
  'item.weapon.veil-thorn',
  'item.charm.ash-circlet',
]

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
    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
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
    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await soak(page, 500)

    const journey = await page.evaluate((firstRun) => {
      const g = window.__MOURNEVEIL_GATE__
      const phases = []
      const owned = () => new Set(g.snapshot().inventory.entries.map((e) => e.itemId))

      const pickup = () => {
        const loot = g.snapshot().lootPickup
        if (!loot.active || loot.position === null) throw new Error('loot missing')
        g.setPlayerPosition(loot.position)
        for (let step = 0; step < 8; step += 1) g.advance(1)
      }

      g.resetMeleeFixture()
      g.restorePlayer()

      g.defeatEnemy('enemy.skirmisher.introduction')
      if (g.snapshot().lootPickup.itemId !== 'item.charm.vitality') {
        throw new Error(`early expected vitality got ${g.snapshot().lootPickup.itemId}`)
      }
      pickup()
      phases.push({ phase: 'early-intro', owned: [...owned()] })

      g.defeatEnemy('enemy.skirmisher.1')
      pickup()
      phases.push({ phase: 'early-court-skirmisher', owned: [...owned()] })

      g.defeatEnemy('enemy.brute.1')
      pickup()
      phases.push({ phase: 'mid-court-brute+ember', owned: [...owned()] })
      if (!owned().has('item.charm.oathbrand-ember')) {
        throw new Error('mixed-clear ember grant missing')
      }

      g.defeatEnemy('enemy.skirmisher.pressure')
      pickup()
      phases.push({ phase: 'late-pressure+veil-thorn', owned: [...owned()] })
      if (!owned().has('item.weapon.veil-thorn')) {
        throw new Error('pressure-clear veil-thorn grant missing')
      }

      g.defeatEnemy('enemy.boss.sepulchre.1')
      if (g.snapshot().lootPickup.itemId !== 'item.charm.ash-circlet') {
        throw new Error(`boss expected ash circlet got ${g.snapshot().lootPickup.itemId}`)
      }
      pickup()
      phases.push({ phase: 'boss-rite', owned: [...owned()] })

      const finalOwned = owned()
      for (const id of firstRun) {
        if (!finalOwned.has(id)) throw new Error(`missing first-run item ${id}`)
      }
      if (finalOwned.size < 6) throw new Error(`expected >=6 items got ${finalOwned.size}`)

      // Replay safety: reload must not re-grant clear rewards
      localStorage.setItem(
        'mourneveil.save.v4',
        JSON.stringify({
          version: 4,
          activeCheckpointId: null,
          checkpointActivated: false,
          flaskCharges: g.snapshot().flask.currentCharges,
          echoesCarried: g.snapshot().echoes.carried,
          echoRecovery: { active: false, amount: 0, position: null },
          inventory: g.snapshot().inventory.entries,
          equipment: {
            weaponItemId: g.snapshot().equipment.weaponItemId,
            charmItemId: g.snapshot().equipment.charmItemId,
          },
          lootPickup: {
            active: false,
            instanceId: null,
            itemId: null,
            position: null,
            spawnedFromEnemyId: null,
            spawnedFromEnemyIds: g.snapshot().lootPickup.spawnedFromEnemyIds,
          },
          world: {
            openedShortcutIds: [...g.snapshot().world.openedShortcutIds],
            finalGateReached: g.snapshot().world.finalGateReached,
            defeatedBossIds: [...g.snapshot().world.defeatedBossIds],
          },
          progression: {
            level: g.snapshot().progression.level,
            experience: g.snapshot().progression.experience,
            unspentPoints: g.snapshot().progression.unspentPoints,
            allocation: { ...g.snapshot().progression.allocation },
          },
          skills: { equippedSkillId: g.snapshot().skills.equippedSkillId },
        }),
      )

      return {
        phases,
        count: finalOwned.size,
        owned: [...finalOwned].sort(),
        echoes: g.snapshot().echoes.carried,
        defeatedBoss: g.snapshot().world.defeatedBossIds.includes('boss.veilbound-sepulchre'),
      }
    }, FIRST_RUN)

    for (const phase of journey.phases) {
      pass(`${phase.phase}: ${phase.owned.length} items`)
    }
    pass(`first-run diversity ${journey.count}`)
    if (!journey.defeatedBoss) fail('boss not marked defeated')

    await continueExistingSession(page, baseUrl)
    await soak(page, 600)

    await page.evaluate(({ ownedBefore, echoesBefore }) => {
      const g = window.__MOURNEVEIL_GATE__
      const owned = g.snapshot().inventory.entries.map((e) => e.itemId).sort()
      if (JSON.stringify(owned) !== JSON.stringify(ownedBefore)) {
        throw new Error(`inventory changed after reload ${owned} vs ${ownedBefore}`)
      }
      const echoes = g.snapshot().echoes.carried
      g.defeatEnemy('enemy.skirmisher.1')
      g.defeatEnemy('enemy.brute.1')
      g.defeatEnemy('enemy.skirmisher.pressure')
      g.defeatEnemy('enemy.boss.sepulchre.1')
      if (g.snapshot().echoes.carried !== echoes) {
        // Echo conversion from exhausted tables is OK; inventory must not grow
      }
      if (g.snapshot().inventory.entries.length !== ownedBefore.length) {
        throw new Error('inventory grew after reload defeats — duplicate grant')
      }
      if (g.snapshot().echoes.carried < echoesBefore) {
        throw new Error('echoes decreased unexpectedly')
      }
    }, { ownedBefore: journey.owned, echoesBefore: journey.echoes })
    pass('reload: no duplicate first-run grants')

    if (pageErrors.length > 0) fail(`page errors: ${pageErrors.join(' | ')}`)
    else pass('no page errors')
  },
})

if (cleanupReport && cleanupReport.artifactDirRemoved === false && !process.env.KEEP_ARTIFACTS) {
  fail('artifact dir not removed')
}
if (failures.length > 0) {
  console.error(`FAIL: gate:m14-loot-journey (${failures.length})`)
  process.exit(1)
}
console.log('PASS: gate:m14-loot-journey')
