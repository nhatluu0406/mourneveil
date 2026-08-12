import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m11-boss-visual'
const PORT = 4206
const BOSS_ID = 'enemy.boss.sepulchre.1'
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => { failures.push(message); console.error(`FAIL: ${message}`) }

async function settle(page, milliseconds = 120) {
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 40) await page.waitForTimeout(40)
}

async function capture(page, artifactDir, name, milliseconds = 120) {
  await settle(page, milliseconds)
  await page.screenshot({ path: `${artifactDir}/${name}.png`, fullPage: false })
}

async function setupArena(page, playerPosition = { x: 11.2, y: 0.82, z: -4 }) {
  return page.evaluate(({ bossId, playerPosition }) => {
    const g = window.__MOURNEVEIL_GATE__
    g.resetMeleeFixture()
    g.restorePlayer()
    for (const enemy of g.snapshot().enemies) {
      if (enemy.id === bossId) continue
      g.defeatEnemy(enemy.id)
      const loot = g.snapshot().lootPickup
      if (loot.available && loot.position !== null) {
        g.setPlayerPosition(loot.position)
        g.advance(3)
      }
    }
    g.equipItem('item.weapon.oathblade')
    g.equipItem('item.charm.vitality')
    g.setPlayerPosition(playerPosition)
    g.setPlayerFacing({ x: 1, z: 0 })
    g.advance(30)
    const boss = g.snapshot().enemies.find((enemy) => enemy.id === bossId)
    if (!boss?.alive) throw new Error('Boss unavailable after arena setup')
    return { health: boss.health, state: boss.state }
  }, { bossId: BOSS_ID, playerPosition })
}

async function waitForAttack(page, kind, distance) {
  return page.evaluate(({ bossId, kind, distance }) => {
    const g = window.__MOURNEVEIL_GATE__
    for (let step = 0; step < 1800; step += 1) {
      let snapshot = g.snapshot()
      let boss = snapshot.enemies.find((enemy) => enemy.id === bossId)
      if (!boss?.alive) throw new Error(`Boss unavailable while waiting for ${kind}`)
      if (!snapshot.playerHealth.health.alive) g.restorePlayer()
      if (boss.action.phase === 'idle') {
        g.setPlayerPosition({ x: boss.position.x, y: 0.82, z: boss.position.z + distance })
        g.setPlayerFacing({ x: 0, z: -1 })
      }
      g.advance(1)
      snapshot = g.snapshot()
      boss = snapshot.enemies.find((enemy) => enemy.id === bossId)
      if (boss?.action.phase === 'startup' && boss.action.actionId === `enemy.boss.${kind}`) {
        return { actionId: boss.action.actionId, phase: boss.action.phase, step: snapshot.simulation.stepCount }
      }
    }
    throw new Error(`Boss never presented ${kind} startup`)
  }, { bossId: BOSS_ID, kind, distance })
}

async function enterPhaseTwo(page) {
  return page.evaluate((bossId) => {
    const g = window.__MOURNEVEIL_GATE__
    const find = () => g.snapshot().enemies.find((enemy) => enemy.id === bossId)
    const maximum = find().health.maximum
    for (let attempt = 0; attempt < 42; attempt += 1) {
      g.restorePlayer()
      let boss = find()
      if (!boss?.alive) throw new Error('Boss died before phase two')
      if (boss.health.current / maximum <= 0.48) return boss.health
      for (let step = 0; step < 140 && find().action.phase !== 'idle'; step += 1) g.advance(1)
      boss = find()
      g.setPlayerPosition({ x: boss.position.x, y: 0.82, z: boss.position.z + 1.1 })
      g.setPlayerFacing({ x: 0, z: -1 })
      const accepted = g.requestAttack({ x: 0, z: -1 }, 'heavy')
      if (accepted?.accepted === false) continue
      for (let step = 0; step < 72; step += 1) g.advance(1)
    }
    const health = find().health
    if (health.current / health.maximum > 0.5) throw new Error(`Phase two not reached: ${health.current}/${health.maximum}`)
    return health
  }, BOSS_ID)
}

let cleanupReport = null
await runOwnedBrowserGate({
  artifactDir: OUT,
  port: PORT,
  viewport: { width: 1440, height: 900 },
  afterCleanup: (report) => { cleanupReport = report },
  run: async (page, { baseUrl, artifactDir }) => {
    const pageErrors = []
    const assetErrors = []
    page.on('pageerror', (error) => pageErrors.push(String(error)))
    page.on('console', (message) => { if (/failed to load|404.*assets|GLTFLoader/i.test(message.text())) assetErrors.push(message.text()) })
    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })

    await setupArena(page, { x: 10.45, y: 0.82, z: -4 })
    await capture(page, artifactDir, '01-arena-arrival', 700)
    await page.evaluate(() => window.__MOURNEVEIL_GATE__.setPlayerPosition({ x: 11.2, y: 0.82, z: -4 }))
    await capture(page, artifactDir, '02-boss-reveal', 650)

    await waitForAttack(page, 'slash', 1.45)
    await capture(page, artifactDir, '03-phase-one-combat')
    await capture(page, artifactDir, '04-slash-telegraph', 40)

    await waitForAttack(page, 'crush', 1.55)
    await capture(page, artifactDir, '05-crush-telegraph', 40)
    await waitForAttack(page, 'lunge', 1.75)
    await capture(page, artifactDir, '06-lunge-telegraph', 40)

    const phaseHealth = await enterPhaseTwo(page)
    pass(`phase two reached at ${phaseHealth.current}/${phaseHealth.maximum}`)
    await capture(page, artifactDir, '07-phase-transition', 80)
    await waitForAttack(page, 'slam', 1.5)
    await capture(page, artifactDir, '08-phase-two-slam', 40)

    const hud = await page.evaluate(() => ({
      bossBar: document.querySelector('.gameplay-hud__threat--boss')?.textContent ?? null,
      locationVisible: document.querySelector('.gameplay-hud__location') !== null,
      objectiveVisible: document.querySelector('.gameplay-hud__objective') !== null,
      equipmentSlots: document.querySelectorAll('.gameplay-hud__equipment-slot').length,
      stats: window.__MOURNEVEIL_GATE__.rendererStats(),
    }))
    hud.bossBar?.includes('THE VEILBOUND SEPULCHRE') ? pass('boss HUD has canonical display identity') : fail(`boss HUD missing: ${hud.bossBar}`)
    !hud.locationVisible && !hud.objectiveVisible ? pass('location/objective panels yield to boss HUD') : fail('location/objective duplication remains during boss threat')
    hud.equipmentSlots === 4 ? pass('compact canonical quick bar remains present') : fail(`equipment slots=${hud.equipmentSlots}`)
    await capture(page, artifactDir, '09-boss-hud')

    const canvas = page.locator('canvas')
    await page.evaluate(() => window.__MOURNEVEIL_GATE__.restorePlayer())
    const bounds = await canvas.boundingBox()
    if (bounds === null) throw new Error('Canvas bounds unavailable')
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    await page.mouse.down({ button: 'right' })
    await page.waitForFunction(() => window.__MOURNEVEIL_GATE__.snapshot().defense.guarding === true, null, { timeout: 3_000 })
    await capture(page, artifactDir, '10-player-guard-readability', 60)
    await page.mouse.up({ button: 'right' })

    await page.setViewportSize({ width: 1280, height: 720 })
    await page.evaluate(() => window.__MOURNEVEIL_GATE__.restorePlayer())
    await capture(page, artifactDir, '13-boss-combat-1280x720', 550)
    await page.setViewportSize({ width: 1440, height: 900 })

    await page.evaluate((bossId) => { window.__MOURNEVEIL_GATE__.restorePlayer(); window.__MOURNEVEIL_GATE__.defeatEnemy(bossId) }, BOSS_ID)
    await capture(page, artifactDir, '11-boss-defeat', 80)
    await capture(page, artifactDir, '12-post-defeat-arena', 2600)

    if (hud.stats !== null) {
      console.log('M11 BOSS METRICS:', JSON.stringify(hud.stats, null, 2))
      hud.stats.drawCalls <= 360 ? pass(`peak boss draw calls ${hud.stats.drawCalls} <= evidence ceiling 360`) : fail(`draw calls ${hud.stats.drawCalls} > 360`)
      hud.stats.programs <= 14 ? pass(`programs ${hud.stats.programs} <= 14`) : fail(`programs ${hud.stats.programs} > 14`)
      hud.stats.lightCount <= 12 ? pass(`lights ${hud.stats.lightCount} <= 12`) : fail(`lights ${hud.stats.lightCount} > 12`)
    } else fail('renderer stats unavailable')
    pageErrors.length === 0 ? pass('no page errors') : fail(pageErrors.join(' | '))
    assetErrors.length === 0 ? pass('no asset errors') : fail(assetErrors.join(' | '))
    if (failures.length > 0) throw new Error(`${failures.length} boss visual failure(s)`)
  },
})

if (cleanupReport?.artifactDirRemoved === false && process.env.KEEP_ARTIFACTS !== '1') {
  console.error('FAIL: artifact dir not cleaned')
  process.exit(1)
}
pass(`owned artifacts ${process.env.KEEP_ARTIFACTS === '1' ? 'kept' : 'removed'}; port ${PORT} reusable`)
console.log('\nM11 boss-visual gate PASS')
