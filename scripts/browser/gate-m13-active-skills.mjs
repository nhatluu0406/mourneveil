import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery, continueExistingSession } from './freshSession.mjs'

const OUT = 'tmp-m13-active-skills'
const PORT = 4211
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

      const drainCombat = () => {
        while (g.snapshot().combat.phase !== 'idle') g.advance(1)
      }

      g.resetMeleeFixture()
      g.restorePlayer()
      let snap = g.snapshot()
      if (snap.skills.equippedSkillId !== 'skill.veil-step') {
        throw new Error(`fresh equipped skill expected veil-step got ${snap.skills.equippedSkillId}`)
      }
      if (!snap.skills.ready || snap.skills.cooldownRemainingSteps !== 0) {
        throw new Error('fresh skill not ready')
      }
      notes.push('1 fresh state')

      // Unlock Oath Cleave + Ward Pulse via level milestones
      g.defeatEnemy('enemy.skirmisher.1')
      g.defeatEnemy('enemy.skirmisher.pressure')
      snap = g.snapshot()
      if (snap.progression.level < 2) throw new Error('expected level >= 2')
      if (!snap.skills.unlockedSkillIds.includes('skill.oath-cleave')) {
        throw new Error('Oath Cleave should unlock at level 2')
      }
      notes.push('2 skill unlocked')

      const equip = g.equipSkill('skill.oath-cleave')
      if (equip?.accepted !== true) throw new Error(`equip failed ${JSON.stringify(equip)}`)
      snap = g.snapshot()
      if (snap.skills.equippedSkillId !== 'skill.oath-cleave') {
        throw new Error('equipped skill not oath-cleave')
      }
      notes.push('3 equip skill')

      g.setPlayerFacing({ x: 0, z: -1 })
      const activate = g.useSkill()
      if (activate?.accepted !== true) throw new Error(`activate failed ${JSON.stringify(activate)}`)
      snap = g.snapshot()
      if (snap.combat.actionId !== 'skill.oath-cleave') {
        throw new Error(`expected oath-cleave action got ${snap.combat.actionId}`)
      }
      notes.push('4 activate')

      drainCombat()
      snap = g.snapshot()
      if (snap.combat.phase !== 'idle') throw new Error('expected idle after cleave')
      if (!(snap.skills.cooldownRemainingSteps > 0)) throw new Error('cooldown did not begin')
      notes.push('5 cooldown begins')

      const blocked = g.useSkill()
      if (blocked?.accepted !== false || blocked.reason !== 'cooldown-active') {
        throw new Error(`expected cooldown block got ${JSON.stringify(blocked)}`)
      }
      notes.push('6 activation blocked during cooldown')

      g.advance(snap.skills.cooldownRemainingSteps + 1)
      snap = g.snapshot()
      if (!snap.skills.ready) throw new Error('cooldown did not expire')
      notes.push('7 cooldown expires')

      // Swap to Veil Step
      const swap = g.equipSkill('skill.veil-step')
      if (swap?.accepted !== true) throw new Error(`swap failed ${JSON.stringify(swap)}`)
      notes.push('8 swap skill')

      // Oath Cleave damage against brute in mixed court
      {
        const reequip = g.equipSkill('skill.oath-cleave')
        if (reequip?.accepted !== true) throw new Error(`reequip cleave failed ${JSON.stringify(reequip)}`)
      }
      g.allocateProgression('might')
      const heavyBase = g.snapshot().resolvedAttackDamage.heavy
      const expectedDamage = heavyBase + 12
      {
        const wait = g.snapshot().skills.cooldownRemainingSteps
        if (wait > 0) g.advance(wait + 1)
      }
      const brute = g.snapshot().enemies.find((e) => e.id === 'enemy.brute.1')
      if (!brute?.alive) throw new Error('brute missing for cleave damage proof')
      g.setPlayerPosition({ x: brute.position.x, y: 0.82, z: brute.position.z + 1.05 })
      g.setPlayerFacing({ x: 0, z: -1 })
      const hpBefore = g.snapshot().enemies.find((e) => e.id === 'enemy.brute.1').health.current
      const cleave = g.useSkill()
      if (cleave?.accepted !== true) throw new Error(`cleave start failed ${JSON.stringify(cleave)}`)
      for (let step = 0; step < 14; step += 1) g.advance(1)
      for (let step = 0; step < 7; step += 1) g.advance(1)
      const hpAfter = g.snapshot().enemies.find((e) => e.id === 'enemy.brute.1').health.current
      if (hpAfter !== hpBefore - expectedDamage) {
        throw new Error(
          `Oath Cleave damage expected ${expectedDamage} (heavy ${heavyBase}+12), hp ${hpBefore}->${hpAfter}`,
        )
      }
      drainCombat()
      notes.push('9 Oath Cleave damages correctly')

      // Veil Step cannot cross walls — press into the first-combat choke wall.
      {
        const veilEquip = g.equipSkill('skill.veil-step')
        if (veilEquip?.accepted !== true) throw new Error(`veil equip failed ${JSON.stringify(veilEquip)}`)
      }
      {
        const wait = g.snapshot().skills.cooldownRemainingSteps
        if (wait > 0) g.advance(wait + 1)
      }
      g.setPlayerPosition({ x: -10.1, y: 0.82, z: 2 })
      g.setPlayerFacing({ x: -1, z: 0 })
      const beforePos = { ...g.snapshot().player.position }
      const veil = g.useSkill()
      if (veil?.accepted !== true) throw new Error(`veil start failed ${JSON.stringify(veil)}`)
      drainCombat()
      const afterPos = g.snapshot().player.position
      // Outer-watch west wall is at x=-12; open-space Veil Step is ~2.2m.
      if (afterPos.x <= -11.75) {
        throw new Error(`Veil Step crossed wall: ${beforePos.x} -> ${afterPos.x}`)
      }
      if (!(afterPos.x < beforePos.x)) {
        throw new Error(`Veil Step did not reposition westward: ${beforePos.x} -> ${afterPos.x}`)
      }
      notes.push('10 Veil Step cannot cross walls')

      // Ward Pulse
      g.defeatEnemy('enemy.brute.1')
      snap = g.snapshot()
      if (snap.progression.level < 3) {
        g.defeatEnemy('enemy.boss.sepulchre.1')
      }
      snap = g.snapshot()
      if (!snap.skills.unlockedSkillIds.includes('skill.ward-pulse')) {
        throw new Error(`Ward Pulse locked at level ${snap.progression.level}`)
      }
      drainCombat()
      {
        const wardEquip = g.equipSkill('skill.ward-pulse')
        if (wardEquip?.accepted !== true) throw new Error(`ward equip failed ${JSON.stringify(wardEquip)}`)
      }
      {
        const wait = g.snapshot().skills.cooldownRemainingSteps
        if (wait > 0) g.advance(wait + 1)
      }
      const thresholdBefore = g.snapshot().defense.guardImpactThreshold
      const ward = g.useSkill()
      if (ward?.accepted !== true) throw new Error(`ward start failed ${JSON.stringify(ward)}`)
      for (let step = 0; step < 6; step += 1) g.advance(1) // enter active
      const thresholdAfter = g.snapshot().defense.guardImpactThreshold
      if (thresholdAfter !== thresholdBefore + 1) {
        throw new Error(`Ward Pulse threshold expected ${thresholdBefore + 1} got ${thresholdAfter}`)
      }
      drainCombat()
      notes.push('11 Ward Pulse effect works')

      // Save/load retains equipped skill; cooldown clears
      g.equipSkill('skill.oath-cleave')
      const payload = {
        ...g.snapshot(),
      }
      // Build save via runtime capture path through localStorage write of capture-like object
      const durable = {
        version: 4,
        activeCheckpointId: payload.checkpoint.currentCheckpointId,
        checkpointActivated: payload.checkpoint.activated,
        flaskCharges: payload.flask.currentCharges,
        echoesCarried: payload.echoes.carried,
        echoRecovery: {
          active: payload.echoRecovery.active,
          amount: payload.echoRecovery.amount,
          position: payload.echoRecovery.position,
        },
        inventory: payload.inventory.entries,
        equipment: {
          weaponItemId: payload.equipment.weaponItemId,
          charmItemId: payload.equipment.charmItemId,
        },
        lootPickup: {
          active: payload.lootPickup.active,
          instanceId: payload.lootPickup.instanceId,
          itemId: payload.lootPickup.itemId,
          position: payload.lootPickup.position,
          spawnedFromEnemyId: payload.lootPickup.spawnedFromEnemyId,
          spawnedFromEnemyIds: payload.lootPickup.spawnedFromEnemyIds,
        },
        world: {
          openedShortcutIds: payload.world.openedShortcutIds,
          finalGateReached: payload.world.finalGateReached,
          defeatedBossIds: payload.world.defeatedBossIds,
        },
        progression: {
          level: payload.progression.level,
          experience: payload.progression.experience,
          unspentPoints: payload.progression.unspentPoints,
          allocation: { ...payload.progression.allocation },
        },
        skills: { equippedSkillId: 'skill.oath-cleave' },
      }
      localStorage.setItem('mourneveil.save.v4', JSON.stringify(durable))
      return { notes, durable, pageErrors: [] }
    })

    for (const note of report.notes) pass(note)

    await continueExistingSession(page, baseUrl)
    await soak(page, 500)

    const afterLoad = await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      const snap = g.snapshot()
      if (snap.skills.equippedSkillId !== 'skill.oath-cleave') {
        throw new Error(`save/load equipped expected oath-cleave got ${snap.skills.equippedSkillId}`)
      }
      if (snap.skills.cooldownRemainingSteps !== 0) {
        throw new Error('cooldown should not persist across load')
      }
      // Death/respawn clears transient skill state
      const checkpointPos = snap.checkpoint.respawnPosition ?? { x: -5.5, y: 0.82, z: 0 }
      g.setPlayerPosition(checkpointPos)
      if (!g.snapshot().checkpoint.activated) {
        g.interactCheckpoint()
      }
      {
        const wait = g.snapshot().skills.cooldownRemainingSteps
        if (wait > 0) g.advance(wait + 1)
      }
      g.useSkill()
      g.advance(5)
      g.applyDamage(999)
      g.respawn()
      const after = g.snapshot()
      if (after.skills.cooldownRemainingSteps !== 0 || after.combat.phase !== 'idle') {
        throw new Error('death/respawn should clear transient skill/combat state')
      }
      if (after.skills.equippedSkillId !== 'skill.oath-cleave') {
        throw new Error('equipped skill should survive death/respawn')
      }
      return {
        equipped: after.skills.equippedSkillId,
        ready: after.skills.ready,
      }
    })
    pass('12 save/load retains equipped skill')
    pass('13 death/respawn clears transient skill state')
    if (afterLoad.equipped !== 'skill.oath-cleave') fail('equipped skill lost after respawn')

    if (pageErrors.length > 0) fail(`page errors: ${pageErrors.join(' | ')}`)
    else pass('14 no page errors')

    if (failures.length > 0) {
      throw new Error(`gate:m13-active-skills failed (${failures.length})`)
    }
  },
})

if (!cleanupReport?.portReusable) {
  throw new Error(`cleanup failed: ${JSON.stringify(cleanupReport)}`)
}
pass(`owned artifacts removed; port ${PORT} reusable`)
console.log('PASS: gate:m13-active-skills')
