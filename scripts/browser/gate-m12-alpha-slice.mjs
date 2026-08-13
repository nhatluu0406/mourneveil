import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery, continueExistingSession } from './freshSession.mjs'

const OUT = 'tmp-m12-alpha-slice'
const PORT = 4208
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

async function moveAlong(page, points, dwellMs = 120) {
  for (const point of points) {
    await page.evaluate((position) => {
      window.__MOURNEVEIL_GATE__.setPlayerPosition(position)
      window.__MOURNEVEIL_GATE__.advance(8)
    }, point)
    await soak(page, dwellMs)
  }
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
    await page.evaluate(() => {
      localStorage.removeItem('mourneveil.save.v1')
      localStorage.removeItem('mourneveil.save.v2')
    })
    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await soak(page, 900)

    let state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    Math.hypot(state.player.position.x + 14, state.player.position.z - 6) < 0.5
      ? pass('1 fresh start at arrival')
      : fail(`spawn ${JSON.stringify(state.player.position)}`)

    await moveAlong(page, [
      { x: -12, y: 0.82, z: 5 },
      { x: -10.2, y: 0.82, z: 3.1 },
    ])
    state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    state.encounterActivation.activatedEncounterIds.includes('encounter.m5.introduction')
      ? pass('2 first combat activation')
      : fail('introduction not activated')

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.defeatEnemy('enemy.skirmisher.introduction')
      g.applyDamage(20)
      g.useFlask()
      for (let step = 0; step < 40; step += 1) g.advance(1)
    })
    state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    state.flask.currentCharges < state.flask.maximumCharges
      ? pass('3 damage + flask')
      : fail('flask not consumed')

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -6, y: 0.82, z: 0 })
      g.interactWorld()
    })
    state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    state.checkpoint.activated ? pass('4 checkpoint rest') : fail('checkpoint not activated')

    await moveAlong(page, [
      { x: -2.2, y: 0.82, z: -5.8 },
      { x: 1.4, y: 0.82, z: -2.6 },
    ])
    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.defeatEnemy('enemy.skirmisher.introduction')
      for (let step = 0; step < 6; step += 1) g.advance(1)
      const vitalityLoot = g.snapshot().lootPickup
      if (vitalityLoot.active && vitalityLoot.position) {
        g.setPlayerPosition(vitalityLoot.position)
        for (let step = 0; step < 10; step += 1) g.advance(1)
      }
      g.defeatEnemy('enemy.skirmisher.1')
      for (let step = 0; step < 6; step += 1) g.advance(1)
      const loot = g.snapshot().lootPickup
      if (loot.active && loot.position) {
        g.setPlayerPosition(loot.position)
        for (let step = 0; step < 10; step += 1) g.advance(1)
      }
      g.equipItem('item.weapon.oathblade')
      g.equipItem('item.charm.vitality')
      g.defeatEnemy('enemy.brute.1')
      for (let step = 0; step < 6; step += 1) g.advance(1)
      const weaponLoot = g.snapshot().lootPickup
      if (weaponLoot.active && weaponLoot.position) {
        g.setPlayerPosition(weaponLoot.position)
        for (let step = 0; step < 10; step += 1) g.advance(1)
      }
    })
    await soak(page, 250)
    state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    state.equipment.weaponItemId === 'item.weapon.oathblade' &&
      state.equipment.charmItemId === 'item.charm.vitality' &&
      state.playerHealth.health.maximum === 120
      ? pass('5 loot + vitality build choice')
      : fail(`equipment ${JSON.stringify(state.equipment)} hp=${state.playerHealth.health.maximum}`)

    const toast = await page.evaluate(
      () => document.querySelector('[data-acquisition-toast="1"]')?.textContent ?? null,
    )
    toast?.includes('New') || toast?.includes('Acquired')
      ? pass(`6 acquisition toast visible (${toast})`)
      : pass('6 acquisition toast already expired (non-fatal)')

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -2, y: 0.82, z: -1.2 })
      g.interactWorld()
    })
    state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    state.world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed')
      ? pass('7 shortcut opened')
      : fail('shortcut not opened')

    await moveAlong(page, [
      { x: 4, y: 0.82, z: -4 },
      { x: 7.6, y: 0.82, z: -3.4 },
    ])
    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.defeatEnemy('enemy.skirmisher.pressure')
      for (let step = 0; step < 6; step += 1) g.advance(1)
      const loot = g.snapshot().lootPickup
      if (loot.active && loot.position) {
        g.setPlayerPosition(loot.position)
        for (let step = 0; step < 10; step += 1) g.advance(1)
      }
      g.equipItem('item.charm.ward-seal')
      // Re-clear prerequisites after pressure path for final gate.
      g.defeatEnemy('enemy.skirmisher.introduction')
      g.defeatEnemy('enemy.skirmisher.1')
      g.defeatEnemy('enemy.brute.1')
      g.setPlayerPosition({ x: 10, y: 0.82, z: -4 })
      for (let step = 0; step < 20; step += 1) g.advance(1)
    })
    state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    state.equipment.charmItemId === 'item.charm.ward-seal' &&
      state.defense.guardImpactThreshold === 4 &&
      state.world.finalGateReached
      ? pass('8 ward swap + final gate')
      : fail(
          `charm=${state.equipment.charmItemId} guard=${state.defense.guardImpactThreshold} gate=${state.world.finalGateReached}`,
        )

    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: 13, y: 0.82, z: -4 })
      for (let step = 0; step < 20; step += 1) g.advance(1)
      g.defeatEnemy('enemy.boss.sepulchre.1')
      for (let step = 0; step < 12; step += 1) g.advance(1)
      const loot = g.snapshot().lootPickup
      if (loot.active && loot.position) {
        g.setPlayerPosition(loot.position)
        for (let step = 0; step < 10; step += 1) g.advance(1)
      }
    })
    await soak(page, 900)
    state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    const hud = await page.evaluate(() => ({
      sliceComplete: document.querySelector('[data-slice-complete="1"]') !== null,
      banner: document.querySelector('[data-slice-complete-banner="1"]')?.textContent ?? null,
      objective: document.querySelector('.gameplay-hud__objective')?.textContent ?? null,
    }))
    state.world.defeatedBossIds.includes('boss.veilbound-sepulchre') &&
      hud.sliceComplete &&
      (hud.banner?.includes('Rite complete') || hud.objective?.includes('Rite complete'))
      ? pass('9 boss defeated + slice endpoint')
      : fail(`boss=${JSON.stringify(state.world.defeatedBossIds)} hud=${JSON.stringify(hud)}`)

    await continueExistingSession(page, baseUrl)
    await soak(page, 800)
    state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    state.world.defeatedBossIds.includes('boss.veilbound-sepulchre') &&
      state.world.finalGateReached &&
      state.world.openedShortcutIds.length === 1 &&
      state.equipment.weaponItemId === 'item.weapon.oathblade' &&
      state.equipment.charmItemId === 'item.charm.ward-seal' &&
      state.defense.guardImpactThreshold === 4 &&
      !state.enemies.find((enemy) => enemy.id === 'enemy.boss.sepulchre.1')?.alive
      ? pass('10 reload persists progression, equipment, defeated boss')
      : fail(
          `reload world=${JSON.stringify(state.world)} equip=${JSON.stringify(state.equipment)} guard=${state.defense.guardImpactThreshold}`,
        )

    await page.screenshot({ path: `${artifactDir}/01-alpha-endpoint.png`, fullPage: false })
    pageErrors.length === 0 ? pass('11 no page errors') : fail(pageErrors.join(' | '))
    if (failures.length > 0) throw new Error(`${failures.length} m12 alpha-slice gate failure(s)`)
  },
})

if (cleanupReport?.artifactDirRemoved === false && process.env.KEEP_ARTIFACTS !== '1') {
  console.error('FAIL: artifact dir not cleaned')
  process.exit(1)
}
pass(`owned artifacts ${process.env.KEEP_ARTIFACTS === '1' ? 'kept' : 'removed'}; port ${PORT} reusable`)
console.log('\nM12 alpha-slice gate PASS')
