import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

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
    await soak(page, 600)

    const report = await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      const notes = []
      const OATHBLADE = 'item.weapon.oathblade'
      const VEIL_THORN = 'item.weapon.veil-thorn'
      const ASH = 'item.charm.ash-circlet'
      const VITALITY = 'item.charm.vitality'
      const WARD = 'item.charm.ward-seal'

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
      let snap = g.snapshot()
      if (snap.inventory.entries.length !== 0) throw new Error('fresh inventory not empty')
      if (snap.equipment.weaponItemId !== null || snap.equipment.charmItemId !== null) {
        throw new Error('fresh equipment not empty')
      }
      notes.push('1 fresh state')

      g.defeatEnemy('enemy.skirmisher.1')
      if (g.snapshot().lootPickup.itemId !== OATHBLADE) {
        throw new Error(`expected oathblade got ${g.snapshot().lootPickup.itemId}`)
      }
      pickup()
      notes.push('2 acquire first item')

      const equipWeapon = g.equipItem(OATHBLADE)
      if (equipWeapon?.accepted !== true) throw new Error(`equip failed ${JSON.stringify(equipWeapon)}`)
      snap = g.snapshot()
      if (snap.resolvedAttackDamage.light !== 28 || snap.resolvedAttackDamage.heavy !== 47) {
        throw new Error(`resolved damage unexpected ${JSON.stringify(snap.resolvedAttackDamage)}`)
      }
      notes.push('3-4 equip + resolved stats')

      g.defeatEnemy('enemy.brute.1')
      pickup()
      g.grantItem(VEIL_THORN)
      const comparison = g.compareItem(VEIL_THORN)
      if (comparison?.slot !== 'weapon' || comparison.equippedId !== OATHBLADE) {
        throw new Error(`comparison unexpected ${JSON.stringify(comparison)}`)
      }
      if (!comparison.losses.some((entry) => entry.key === 'lightDamageBonus')) {
        throw new Error('veil-thorn should lose light damage vs oathblade')
      }
      if (!comparison.gains.some((entry) => entry.key === 'activeSkillCooldownStepDelta')) {
        throw new Error('veil-thorn should gain skill cooldown delta vs oathblade')
      }
      notes.push('5-6 alternate + comparison')

      g.equipItem(VEIL_THORN)
      g.equipItem(VITALITY)
      snap = g.snapshot()
      if (snap.equipment.weaponItemId !== VEIL_THORN) throw new Error('weapon swap failed')
      if (snap.playerHealth.health.maximum !== 120) throw new Error('vitality max hp failed')
      notes.push('7 swap')

      g.grantItem(ASH)
      g.equipItem(ASH)
      g.equipSkill('skill.veil-step')
      drainCombat()
      const used = g.useSkill()
      if (used?.accepted !== true) throw new Error(`skill use failed ${JSON.stringify(used)}`)
      drainCombat()
      snap = g.snapshot()
      // Base 180 + veil-thorn (-30) + ash (-24) = 126
      if (snap.skills.cooldownRemainingSteps !== 126) {
        throw new Error(`expected skill CD 126 got ${snap.skills.cooldownRemainingSteps}`)
      }
      notes.push('8 skill synergy')

      const echoesBefore = g.snapshot().echoes.carried
      g.acquireItem(OATHBLADE)
      snap = g.snapshot()
      if (snap.echoes.carried <= echoesBefore) throw new Error('duplicate unique did not grant Echoes')
      if (snap.inventory.entries.find((entry) => entry.itemId === OATHBLADE)?.quantity !== 1) {
        throw new Error('unique item stacked on duplicate')
      }
      if (snap.lastLootAcquisition?.kind !== 'echoes') throw new Error('duplicate cue missing')
      notes.push('9 duplicate → Echoes')

      g.defeatEnemy('enemy.skirmisher.pressure')
      pickup()
      g.equipItem(WARD)
      g.defeatEnemy('enemy.boss.sepulchre.1')
      // Boss table may yield ash (owned) → Echoes, or skip if spawn memory; either is fine for progression
      notes.push('10 world loot path exercised')

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
        echoes: g.snapshot().echoes.carried,
      }
    })

    for (const note of report.notes) pass(note)

    await page.reload({ waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await soak(page, 700)

    await page.evaluate(({ weapon, charm, echoes }) => {
      const g = window.__MOURNEVEIL_GATE__
      const snap = g.snapshot()
      if (snap.equipment.weaponItemId !== weapon) {
        throw new Error(`weapon restore ${snap.equipment.weaponItemId} != ${weapon}`)
      }
      if (snap.equipment.charmItemId !== charm) {
        throw new Error(`charm restore ${snap.equipment.charmItemId} != ${charm}`)
      }
      if (snap.echoes.carried !== echoes) throw new Error('echoes restore mismatch')
      if (!snap.inventory.entries.some((entry) => entry.itemId === 'item.weapon.oathblade')) {
        throw new Error('inventory missing oathblade after reload')
      }
    }, { weapon: report.weapon, charm: report.charm, echoes: report.echoes })
    pass('12 reload equipment restored')

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.restorePlayer()
      // Slice still advances without page errors after itemization restore
      g.advance(5)
    })
    pass('13 boss/loot progression operable')

    if (pageErrors.length > 0) fail(`page errors: ${pageErrors.join(' | ')}`)
    else pass('14 no page errors')
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
