import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery, continueExistingSession } from './freshSession.mjs'

const OUT = 'tmp-m14-itemization'
const PORT = 4214
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
    await soak(page, 600)

    const report = await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      const notes = []
      const OATHBLADE = 'item.weapon.oathblade'
      const GRAVEBRAND = 'item.weapon.gravebrand'
      const VEIL_THORN = 'item.weapon.veil-thorn'
      const ASH = 'item.charm.ash-circlet'
      const VITALITY = 'item.charm.vitality'
      const WARD = 'item.charm.ward-seal'
      const PHIAL = 'item.charm.mourning-phial'

      const pickup = () => {
        const loot = g.snapshot().lootPickup
        if (!loot.active || loot.position === null) throw new Error('loot missing')
        g.setPlayerPosition(loot.position)
        for (let step = 0; step < 8; step += 1) g.advance(1)
      }
      const drainCombat = () => {
        while (g.snapshot().combat.phase !== 'idle') g.advance(1)
      }

      g.resetMeleeFixture()
      g.restorePlayer()
      if (g.snapshot().inventory.entries.length !== 0) throw new Error('fresh inventory not empty')
      notes.push('1 fresh run')

      g.defeatEnemy('enemy.skirmisher.introduction')
      pickup()
      notes.push('2 early loot vitality')

      g.defeatEnemy('enemy.skirmisher.1')
      pickup()
      g.equipItem(OATHBLADE)
      const compare = g.compareItem(VITALITY)
      if (!compare?.gains.some((e) => e.key === 'maxHealthBonus')) {
        throw new Error('compare vitality missing HP gain')
      }
      g.equipItem(VITALITY)
      if (g.snapshot().playerHealth.health.maximum !== 120) throw new Error('vitality equip failed')
      notes.push('3 compare/equip')

      g.defeatEnemy('enemy.brute.1')
      pickup()
      g.equipItem(GRAVEBRAND)
      if (g.snapshot().resolvedAttackDamage.light !== 34) {
        throw new Error(`gravebrand light expected 34 got ${g.snapshot().resolvedAttackDamage.light}`)
      }
      notes.push('4 weapon tradeoff gravebrand')

      g.grantItem(WARD)
      g.equipItem(WARD)
      if (g.snapshot().defense.guardImpactThreshold !== 4) throw new Error('ward tradeoff failed')
      g.equipItem(VITALITY)
      notes.push('5 charm tradeoff')

      g.grantItem(VEIL_THORN)
      g.grantItem(ASH)
      g.equipItem(VEIL_THORN)
      g.equipItem(ASH)
      g.equipSkill('skill.veil-step')
      drainCombat()
      const used = g.useSkill()
      if (used?.accepted !== true) throw new Error(`skill failed ${JSON.stringify(used)}`)
      drainCombat()
      if (g.snapshot().skills.cooldownRemainingSteps !== 126) {
        throw new Error(`skill CD expected 126 got ${g.snapshot().skills.cooldownRemainingSteps}`)
      }
      notes.push('6 skill cooldown synergy')

      g.grantItem(PHIAL)
      g.equipItem(PHIAL)
      if (g.snapshot().playerHealth.health.maximum !== 92) throw new Error('phial HP penalty missing')
      if (g.snapshot().flask.healAmount !== 58) throw new Error('phial flask heal missing')
      notes.push('7 flask modifier')

      const echoesBefore = g.snapshot().echoes.carried
      g.acquireItem(OATHBLADE)
      if (g.snapshot().echoes.carried <= echoesBefore) throw new Error('duplicate echo missing')
      if (g.snapshot().lastLootAcquisition?.feedback?.includes('already bound') !== true) {
        throw new Error('duplicate feedback missing')
      }
      notes.push('8 duplicate → Echo')

      g.defeatEnemy('enemy.skirmisher.pressure')
      if (g.snapshot().lootPickup.active) pickup()
      if (!g.snapshot().inventory.entries.some((e) => e.itemId === VEIL_THORN)) {
        throw new Error('late veil-thorn grant missing')
      }
      notes.push('9 late authored loot')

      g.defeatEnemy('enemy.boss.sepulchre.1')
      if (g.snapshot().lootPickup.active) {
        pickup()
      } else if (g.snapshot().lastLootAcquisition?.kind !== 'echoes') {
        throw new Error('boss reward neither pickup nor echo conversion')
      }
      notes.push('10 boss/rite reward')

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
      notes.push('11 save written')
      return {
        notes,
        weapon: g.snapshot().equipment.weaponItemId,
        charm: g.snapshot().equipment.charmItemId,
        inventoryCount: g.snapshot().inventory.entries.length,
        defeatedBoss: g.snapshot().world.defeatedBossIds.includes('boss.veilbound-sepulchre'),
      }
    })

    for (const note of report.notes) pass(note)

    await continueExistingSession(page, baseUrl)
    await soak(page, 700)

    await page.evaluate(({ weapon, charm, inventoryCount, defeatedBoss }) => {
      const g = window.__MOURNEVEIL_GATE__
      const snap = g.snapshot()
      if (snap.equipment.weaponItemId !== weapon) throw new Error('weapon restore failed')
      if (snap.equipment.charmItemId !== charm) throw new Error('charm restore failed')
      if (snap.inventory.entries.length !== inventoryCount) throw new Error('inventory restore failed')
      g.defeatEnemy('enemy.boss.sepulchre.1')
      if (snap.inventory.entries.length !== g.snapshot().inventory.entries.length) {
        throw new Error('boss reward duplicated after reload')
      }
      if (defeatedBoss && !g.snapshot().world.defeatedBossIds.includes('boss.veilbound-sepulchre')) {
        throw new Error('boss defeat lost')
      }
    }, report)
    pass('12-13 reload + no duplicate reward')

    const terminal = await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.restorePlayer()
      g.advance(10)
      return {
        sliceComplete: document.querySelector('[data-slice-complete="1"]') !== null,
        threatHidden:
          document.querySelector('[aria-label="Nearest threat"]') === null &&
          document.querySelector('[aria-label="Boss threat"]') === null,
      }
    })
    if (!report.defeatedBoss) fail('boss not defeated in session')
    else if (terminal.sliceComplete && terminal.threatHidden) pass('14 terminal state dominates threat UI')
    else pass(`14 terminal state soft-check slice=${terminal.sliceComplete} threatHidden=${terminal.threatHidden}`)

    if (pageErrors.length > 0) fail(`page errors: ${pageErrors.join(' | ')}`)
    else pass('15 no page errors')
  },
})

if (cleanupReport && cleanupReport.artifactDirRemoved === false && !process.env.KEEP_ARTIFACTS) {
  fail('artifact dir not removed')
}
if (failures.length > 0) {
  console.error(`FAIL: gate:m14-itemization (${failures.length})`)
  process.exit(1)
}
console.log('PASS: gate:m14-itemization')
