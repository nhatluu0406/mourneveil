import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery } from './freshSession.mjs'

const OUT = 'tmp-m14-art-production'
const PORT = 4215
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => { failures.push(message); console.error(`FAIL: ${message}`) }
const wait = (page, milliseconds = 360) => page.waitForTimeout(milliseconds)
const capture = async (page, artifactDir, name) => { await wait(page); await page.screenshot({ path: `${artifactDir}/${name}.png`, fullPage: false }) }

let cleanupReport = null
await runOwnedBrowserGate({
  artifactDir: OUT,
  port: PORT,
  viewport: { width: 1440, height: 900 },
  afterCleanup: (report) => { cleanupReport = report },
  run: async (page, { baseUrl, artifactDir }) => {
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(String(error)))
    await page.goto(withFreshQuery(baseUrl, '?zoneCull=0'), { waitUntil: 'load' })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await page.evaluate(() => {
      localStorage.removeItem('mourneveil.save.v4')
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture(); g.restorePlayer()
      for (const id of ['item.weapon.oathblade', 'item.weapon.gravebrand', 'item.weapon.veil-thorn', 'item.charm.vitality', 'item.charm.ward-seal', 'item.charm.oathbrand-ember', 'item.charm.ash-circlet', 'item.charm.mourning-phial']) g.grantItem(id)
      g.setPlayerPosition({ x: -5.7, y: 0.82, z: 0.2 }); g.setPlayerFacing({ x: 0.4, z: -0.9 }); g.advance(2)
    })
    await wait(page, 1200)

    for (const [id, name, position, facing] of [
      ['item.weapon.oathblade', '01-oathblade-equipped', { x: -3.95, y: 0.82, z: 0.2 }, { x: 1, z: 0 }],
      ['item.weapon.gravebrand', '02-gravebrand-equipped', { x: -4.0, y: 0.82, z: 1.0 }, { x: 1, z: 0 }],
      ['item.weapon.veil-thorn', '03-veil-thorn-equipped', { x: -7.15, y: 0.82, z: 1.05 }, { x: -1, z: 0 }],
    ]) {
      await page.evaluate(({ itemId, position, facing }) => { const g = window.__MOURNEVEIL_GATE__; g.equipItem(itemId); g.setPlayerPosition(position); g.setPlayerFacing(facing); g.advance(2) }, { itemId: id, position, facing })
      await capture(page, artifactDir, name)
    }

    await page.keyboard.press('i')
    await page.waitForSelector('[data-item-id="item.charm.mourning-phial"]')
    await capture(page, artifactDir, '04-eight-item-family')
    const iconEvidence = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-item-id]')]
      return {
        count: cards.length,
        ids: cards.map((card) => card.getAttribute('data-item-id')),
        glyphs: new Set(cards.map((card) => card.querySelector('svg')?.innerHTML)).size,
        reliquary: cards.filter((card) => card.getAttribute('data-item-rarity') === 'reliquary').length,
      }
    })
    iconEvidence.count === 8 && iconEvidence.glyphs === 8 && iconEvidence.reliquary === 2 ? pass('eight distinct item glyphs with two Reliquary treatments') : fail(`item family ${JSON.stringify(iconEvidence)}`)
    await page.keyboard.press('i')

    await page.evaluate(() => localStorage.removeItem('mourneveil.save.v4'))
    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await page.evaluate(() => { const g = window.__MOURNEVEIL_GATE__; g.resetMeleeFixture(); g.restorePlayer(); g.setPlayerPosition({ x: -5.7, y: 0.82, z: 0.2 }); g.advance(2) })
    await page.evaluate(() => { const g = window.__MOURNEVEIL_GATE__; g.acquireItem('item.charm.oathbrand-ember'); g.advance(1) })
    await capture(page, artifactDir, '05-bound-acquisition')
    await page.evaluate(() => { const g = window.__MOURNEVEIL_GATE__; g.acquireItem('item.charm.ash-circlet'); g.advance(1) })
    await capture(page, artifactDir, '06-reliquary-acquisition')
    const rarity = await page.getAttribute('[data-acquisition-toast="1"]', 'data-acquisition-rarity')
    rarity === 'reliquary' ? pass('Reliquary acquisition chrome projected') : fail(`acquisition rarity ${rarity}`)

    const route = [
      ['07-refuge-floor-light', { x: -5.7, y: 0.82, z: 0.2 }, { x: 0.45, z: -0.9 }],
      ['08-corridor-floor-light', { x: -8.0, y: 0.82, z: 2.0 }, { x: -0.55, z: 0.84 }],
      ['09-court-floor-light', { x: 0.8, y: 0.82, z: -4.3 }, { x: 0.72, z: -0.69 }],
      ['10-mixed-court-floor-light', { x: 2.3, y: 0.82, z: -5.5 }, { x: 0.7, z: 0.72 }],
      ['11-ash-walk-floor-light', { x: 7.0, y: 0.82, z: -4.0 }, { x: 0.9, z: 0.3 }],
      ['12-final-approach', { x: 9.1, y: 0.82, z: -4.0 }, { x: 1, z: 0 }],
      ['13-sepulchre-floor-light', { x: 12.4, y: 0.82, z: -3.8 }, { x: 0.85, z: -0.5 }],
    ]
    for (const [name, position, facing] of route) {
      await page.evaluate(({ position, facing }) => { const g = window.__MOURNEVEIL_GATE__; g.setPlayerPosition(position); g.setPlayerFacing(facing); g.advance(2) }, { position, facing })
      await capture(page, artifactDir, name)
    }
    await page.setViewportSize({ width: 1280, height: 720 })
    await capture(page, artifactDir, '14-gameplay-1280x720')
    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      for (const id of ['item.weapon.oathblade', 'item.weapon.gravebrand', 'item.weapon.veil-thorn']) g.grantItem(id)
    })
    for (const itemId of ['item.weapon.oathblade', 'item.weapon.gravebrand', 'item.weapon.veil-thorn']) {
      await page.evaluate((id) => { const g = window.__MOURNEVEIL_GATE__; g.equipItem(id); g.advance(2) }, itemId)
      await wait(page, 100)
    }
    for (const itemId of ['item.charm.oathbrand-ember', 'item.charm.ash-circlet']) {
      await page.evaluate((id) => { const g = window.__MOURNEVEIL_GATE__; g.acquireItem(id); g.advance(2) }, itemId)
      await wait(page, 100)
    }
    await wait(page, 900)
    const stats = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
    console.log('M14 ART METRICS:', JSON.stringify(stats, null, 2))
    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      for (let iteration = 0; iteration < 12; iteration += 1) {
        g.equipItem(['item.weapon.oathblade', 'item.weapon.gravebrand', 'item.weapon.veil-thorn'][iteration % 3])
        g.acquireItem(iteration % 2 ? 'item.charm.oathbrand-ember' : 'item.charm.ash-circlet')
        g.advance(2)
      }
    })
    await wait(page, 900)
    const afterSoak = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
    const resourceDelta = { geometries: afterSoak.geometries - stats.geometries, textures: afterSoak.textures - stats.textures, meshes: afterSoak.meshCount - stats.meshCount, lights: afterSoak.lightCount - stats.lightCount }
    Object.values(resourceDelta).every((value) => value === 0) ? pass(`pickup/equip resource growth zero ${JSON.stringify(resourceDelta)}`) : fail(`pickup/equip resource growth ${JSON.stringify(resourceDelta)}`)
    stats.drawCalls <= 360 && stats.geometries <= 210 && stats.meshCount <= 330 && stats.sceneObjectCount <= 550 ? pass('M14 art route remains within measured presentation envelope') : fail(`M14 art envelope ${JSON.stringify(stats)}`)
    stats.lightCount <= 12 ? pass(`actual light budget unchanged (${stats.lightCount})`) : fail(`light count ${stats.lightCount}`)
    pageErrors.length === 0 ? pass('no page errors') : fail(pageErrors.join(' | '))
    if (failures.length > 0) throw new Error(`${failures.length} M14 art gate failure(s)`)
  },
})

if (!cleanupReport?.portReusable) throw new Error(`port ${PORT} was not reusable`)
pass(`owned artifacts ${process.env.KEEP_ARTIFACTS === '1' ? 'kept' : 'removed'}; port ${PORT} reusable`)
console.log('\nM14 art-production gate PASS')
