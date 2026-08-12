import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m11-boss-visual'
const PORT = 4206
const BOSS_ID = 'enemy.boss.sepulchre.1'
/**
 * M11 boss-scene ceilings after measured consolidation.
 * Hero encounter may exceed connected-route M10 budgets; margins are intentional.
 */
const BOSS_SCENE = Object.freeze({
  maxDrawCalls: 390,
  maxTriangles: 42_000,
  maxGeometries: 210,
  maxTextures: 8,
  maxPrograms: 14,
  maxSceneObjects: 540,
  maxMeshes: 320,
  maxLights: 12,
})
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
      costRank: (() => {
        const canvas = document.querySelector('canvas')
        const fiberKey = canvas && Object.keys(canvas).find((key) => key.startsWith('__reactFiber'))
        // Ranking uses published renderer stats + named world-object instance probe when available.
        const probe = window.__MOURNEVEIL_GATE__.instanceMatrixProbe?.() ?? []
        return {
          instancedWorldObjects: probe
            .map((entry) => ({ name: entry.name, count: entry.count }))
            .sort((left, right) => right.count - left.count)
            .slice(0, 12),
          fiberPresent: Boolean(fiberKey),
        }
      })(),
    }))
    hud.bossBar?.includes('THE VEILBOUND SEPULCHRE') ? pass('boss HUD has canonical display identity') : fail(`boss HUD missing: ${hud.bossBar}`)
    !hud.locationVisible && !hud.objectiveVisible ? pass('location/objective panels yield to boss HUD') : fail('location/objective duplication remains during boss threat')
    hud.equipmentSlots === 4 ? pass('compact canonical quick bar remains present') : fail(`equipment slots=${hud.equipmentSlots}`)
    await capture(page, artifactDir, '09-boss-hud')
    console.log('M11 BOSS COST RANK (instanced):', JSON.stringify(hud.costRank.instancedWorldObjects, null, 2))

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
    const compactHud = await page.evaluate(() => {
      const boss = document.querySelector('.gameplay-hud__threat--boss')
      const player = document.querySelector('.gameplay-hud__status')
      const items = document.querySelector('.gameplay-hud__equipment-bar')
      const bossBox = boss?.getBoundingClientRect()
      const playerBox = player?.getBoundingClientRect()
      const itemsBox = items?.getBoundingClientRect()
      const overlapPair = (a, b) =>
        a && b
          ? !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
          : false
      return {
        bossPresent: boss !== null,
        playerPresent: player !== null,
        itemsPresent: items !== null,
        overlap: overlapPair(bossBox, playerBox) || overlapPair(bossBox, itemsBox),
        viewport: { width: window.innerWidth, height: window.innerHeight },
      }
    })
    compactHud.bossPresent && compactHud.playerPresent && compactHud.itemsPresent && !compactHud.overlap
      ? pass('1280x720 boss/player/item HUD remain non-overlapping')
      : fail(`1280x720 HUD issue: ${JSON.stringify(compactHud)}`)
    await page.setViewportSize({ width: 1440, height: 900 })
    await settle(page, 200)

    const soakBefore = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
    // Phase ↔ reset soak uses player death BEFORE boss defeat so persistence does not latch defeat.
    await page.evaluate((bossId) => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -6.4, y: 0.82, z: 0 })
      g.interactCheckpoint()
      for (let cycle = 0; cycle < 3; cycle += 1) {
        g.restorePlayer()
        for (const enemy of g.snapshot().enemies) {
          if (enemy.id === bossId) continue
          g.defeatEnemy(enemy.id)
        }
        g.setPlayerPosition({ x: 11.2, y: 0.82, z: -4 })
        g.setPlayerFacing({ x: 1, z: 0 })
        for (let step = 0; step < 30; step += 1) g.advance(1)
        let boss = g.snapshot().enemies.find((enemy) => enemy.id === bossId)
        if (!boss?.alive) throw new Error(`soak boss missing at cycle ${cycle}`)
        const maximum = boss.health.maximum
        for (let attempt = 0; attempt < 48; attempt += 1) {
          boss = g.snapshot().enemies.find((enemy) => enemy.id === bossId)
          if (!boss?.alive) throw new Error('soak boss died unexpectedly')
          if (boss.health.current / maximum <= 0.48) break
          g.restorePlayer()
          g.setPlayerPosition({ x: boss.position.x, y: 0.82, z: boss.position.z + 1.1 })
          g.setPlayerFacing({ x: 0, z: -1 })
          g.requestAttack({ x: 0, z: -1 }, 'heavy')
          for (let step = 0; step < 72; step += 1) g.advance(1)
        }
        g.applyDamage(999)
        g.respawn()
        for (let step = 0; step < 20; step += 1) g.advance(1)
        boss = g.snapshot().enemies.find((enemy) => enemy.id === bossId)
        if (!boss?.alive) throw new Error('boss should revive after pre-defeat player death')
        if (boss.health.current !== boss.health.maximum) {
          throw new Error(`boss HP not restored after reset: ${boss.health.current}/${boss.health.maximum}`)
        }
      }
      g.restorePlayer()
      for (const enemy of g.snapshot().enemies) {
        if (enemy.id === bossId) continue
        g.defeatEnemy(enemy.id)
      }
      g.setPlayerPosition({ x: 11.2, y: 0.82, z: -4 })
      for (let step = 0; step < 45; step += 1) g.advance(1)
    }, BOSS_ID)
    await settle(page, 900)
    await page.setViewportSize({ width: 1440, height: 900 })
    await settle(page, 400)
    const soakAfter = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
    if (soakBefore && soakAfter) {
      const geoDelta = soakAfter.geometries - soakBefore.geometries
      const texDelta = soakAfter.textures - soakBefore.textures
      const meshDelta = soakAfter.meshCount - soakBefore.meshCount
      const lightDelta = soakAfter.lightCount - soakBefore.lightCount
      const objectDelta = soakAfter.sceneObjectCount - soakBefore.sceneObjectCount
      geoDelta <= 4 && texDelta <= 0 && meshDelta <= 8 && lightDelta <= 0 && objectDelta <= 12
        ? pass(`boss phase/death/reset soak bounded geoΔ=${geoDelta} texΔ=${texDelta} meshΔ=${meshDelta} lightΔ=${lightDelta} objΔ=${objectDelta}`)
        : fail(`boss soak growth geoΔ=${geoDelta} texΔ=${texDelta} meshΔ=${meshDelta} lightΔ=${lightDelta} objΔ=${objectDelta}`)
    } else {
      fail('soak stats unavailable')
    }

    await page.evaluate((bossId) => {
      window.__MOURNEVEIL_GATE__.restorePlayer()
      window.__MOURNEVEIL_GATE__.defeatEnemy(bossId)
    }, BOSS_ID)
    await capture(page, artifactDir, '11-boss-defeat', 80)
    await capture(page, artifactDir, '12-post-defeat-arena', 2600)

    const postDefeatHud = await page.evaluate(() => ({
      bossBar: document.querySelector('.gameplay-hud__threat--boss') !== null,
      stats: window.__MOURNEVEIL_GATE__.rendererStats(),
    }))
    !postDefeatHud.bossBar
      ? pass('boss HUD clears after defeat')
      : fail('boss HUD still present after defeat')

    if (hud.stats !== null) {
      console.log('M11 BOSS METRICS:', JSON.stringify(hud.stats, null, 2))
      console.log('M11 BOSS SOAK AFTER:', JSON.stringify(soakAfter, null, 2))
      hud.stats.drawCalls <= BOSS_SCENE.maxDrawCalls
        ? pass(`peak boss draw calls ${hud.stats.drawCalls} <= ${BOSS_SCENE.maxDrawCalls}`)
        : fail(`draw calls ${hud.stats.drawCalls} > ${BOSS_SCENE.maxDrawCalls}`)
      hud.stats.triangles <= BOSS_SCENE.maxTriangles
        ? pass(`triangles ${hud.stats.triangles} <= ${BOSS_SCENE.maxTriangles}`)
        : fail(`triangles ${hud.stats.triangles} > ${BOSS_SCENE.maxTriangles}`)
      hud.stats.geometries <= BOSS_SCENE.maxGeometries
        ? pass(`geometries ${hud.stats.geometries} <= ${BOSS_SCENE.maxGeometries}`)
        : fail(`geometries ${hud.stats.geometries} > ${BOSS_SCENE.maxGeometries}`)
      hud.stats.textures <= BOSS_SCENE.maxTextures
        ? pass(`textures ${hud.stats.textures} <= ${BOSS_SCENE.maxTextures}`)
        : fail(`textures ${hud.stats.textures} > ${BOSS_SCENE.maxTextures}`)
      hud.stats.programs <= BOSS_SCENE.maxPrograms
        ? pass(`programs ${hud.stats.programs} <= ${BOSS_SCENE.maxPrograms}`)
        : fail(`programs ${hud.stats.programs} > ${BOSS_SCENE.maxPrograms}`)
      hud.stats.sceneObjectCount <= BOSS_SCENE.maxSceneObjects
        ? pass(`objects ${hud.stats.sceneObjectCount} <= ${BOSS_SCENE.maxSceneObjects}`)
        : fail(`objects ${hud.stats.sceneObjectCount} > ${BOSS_SCENE.maxSceneObjects}`)
      hud.stats.meshCount <= BOSS_SCENE.maxMeshes
        ? pass(`meshes ${hud.stats.meshCount} <= ${BOSS_SCENE.maxMeshes}`)
        : fail(`meshes ${hud.stats.meshCount} > ${BOSS_SCENE.maxMeshes}`)
      hud.stats.lightCount <= BOSS_SCENE.maxLights
        ? pass(`lights ${hud.stats.lightCount} <= ${BOSS_SCENE.maxLights}`)
        : fail(`lights ${hud.stats.lightCount} > ${BOSS_SCENE.maxLights}`)
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
