import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m12-build-choice'
const PORT = 4207
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
    await soak(page, 800)

    const report = await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      const notes = []
      const VITALITY = 'item.charm.vitality'
      const WARD = 'item.charm.ward-seal'

      const pickup = () => {
        const loot = g.snapshot().lootPickup
        if (!loot.active || loot.position === null) throw new Error('loot missing')
        g.setPlayerPosition(loot.position)
        for (let step = 0; step < 8; step += 1) g.advance(1)
      }

      g.resetMeleeFixture()
      g.restorePlayer()
      const base = g.snapshot()
      notes.push(`base hpMax=${base.playerHealth.health.maximum} guard=${base.defense.guardImpactThreshold}`)

      g.defeatEnemy('enemy.brute.1')
      if (g.snapshot().lootPickup.itemId !== VITALITY) {
        throw new Error(`expected vitality loot, got ${g.snapshot().lootPickup.itemId}`)
      }
      pickup()
      notes.push('acquired vitality')

      const equipA = g.equipItem(VITALITY)
      if (equipA?.accepted !== true) throw new Error(`vitality equip failed: ${JSON.stringify(equipA)}`)
      const withVitality = g.snapshot()
      if (withVitality.playerHealth.health.maximum !== 120) {
        throw new Error(`vitality hp expected 120 got ${withVitality.playerHealth.health.maximum}`)
      }
      if (withVitality.defense.guardImpactThreshold !== 3) {
        throw new Error(`vitality guard expected 3 got ${withVitality.defense.guardImpactThreshold}`)
      }
      notes.push('equipped vitality: hp+20, guard base')

      g.defeatEnemy('enemy.skirmisher.pressure')
      if (g.snapshot().lootPickup.itemId !== WARD) {
        throw new Error(`expected ward loot, got ${g.snapshot().lootPickup.itemId}`)
      }
      pickup()
      notes.push('acquired ward-seal')

      const equipB = g.equipItem(WARD)
      if (equipB?.accepted !== true) throw new Error(`ward equip failed: ${JSON.stringify(equipB)}`)
      const withWard = g.snapshot()
      if (withWard.playerHealth.health.maximum !== 100) {
        throw new Error(`ward hp expected 100 got ${withWard.playerHealth.health.maximum}`)
      }
      if (withWard.defense.guardImpactThreshold !== 4) {
        throw new Error(`ward guard expected 4 got ${withWard.defense.guardImpactThreshold}`)
      }
      if (withWard.equipment.charmItemId !== WARD) throw new Error('ward not equipped')
      notes.push('swapped to ward: hp base, guard+1')

      // Swap back proves inventory still holds both options.
      const reVitality = g.equipItem(VITALITY)
      if (reVitality?.accepted !== true) throw new Error('re-equip vitality failed')
      if (g.snapshot().playerHealth.health.maximum !== 120) throw new Error('vitality re-equip lost HP bonus')
      g.equipItem(WARD)
      if (g.snapshot().defense.guardImpactThreshold !== 4) throw new Error('ward re-equip lost guard bonus')
      notes.push('charm swap tradeoff remains authoritative')

      g.setPlayerPosition({ x: 1.4, y: 0.82, z: -1.8 })
      g.setPlayerFacing({ x: 0, z: -1 })
      const attack = g.requestAttack({ x: 0, z: -1 }, 'light')
      if (attack?.accepted === false) throw new Error('light attack rejected')
      for (let step = 0; step < 40; step += 1) g.advance(1)
      notes.push('combat remains functional with ward equipped')

      const statsBefore = g.rendererStats?.() ?? null
      for (let step = 0; step < 30; step += 1) g.advance(1)
      const statsAfter = g.rendererStats?.() ?? null
      return {
        notes,
        statsBefore,
        statsAfter,
        charmDetail:
          document.querySelector('.gameplay-hud__equipment-slot[data-slot-id="charm"]')?.textContent ?? null,
      }
    })

    await soak(page, 200)
    await page.mouse.move(20, 20)
    await page.waitForFunction(
      () => {
        const text =
          document.querySelector('.gameplay-hud__equipment-slot[data-slot-id="charm"]')?.textContent ?? ''
        return text.includes('Ward Seal') || text.includes('Guard 4')
      },
      null,
      { timeout: 5_000 },
    )
    const hudAfterPaint = await page.evaluate(
      () => document.querySelector('.gameplay-hud__equipment-slot[data-slot-id="charm"]')?.textContent ?? null,
    )

    for (const note of report.notes) pass(note)
    const charmText = hudAfterPaint ?? report.charmDetail
    charmText && (charmText.includes('Guard') || charmText.includes('Ward Seal'))
      ? pass(`HUD projects charm state: ${charmText}`)
      : fail(`HUD charm projection missing: ${charmText}`)

    if (report.statsBefore && report.statsAfter) {
      const geoDelta = report.statsAfter.geometries - report.statsBefore.geometries
      const meshDelta = report.statsAfter.meshCount - report.statsBefore.meshCount
      geoDelta <= 2 && meshDelta <= 2
        ? pass(`no meaningful resource growth geoΔ=${geoDelta} meshΔ=${meshDelta}`)
        : fail(`unexpected growth geoΔ=${geoDelta} meshΔ=${meshDelta}`)
      pass(
        `renderer stats drawCalls=${report.statsAfter.drawCalls} meshes=${report.statsAfter.meshCount} lights=${report.statsAfter.lightCount}`,
      )
    }
    await page.screenshot({ path: `${artifactDir}/01-build-choice.png`, fullPage: false })
    pageErrors.length === 0 ? pass('no page errors') : fail(pageErrors.join(' | '))
    if (failures.length > 0) throw new Error(`${failures.length} m12 build-choice gate failure(s)`)
  },
})

if (cleanupReport?.artifactDirRemoved === false && process.env.KEEP_ARTIFACTS !== '1') {
  console.error('FAIL: artifact dir not cleaned')
  process.exit(1)
}
pass(`owned artifacts ${process.env.KEEP_ARTIFACTS === '1' ? 'kept' : 'removed'}; port ${PORT} reusable`)
console.log('\nM12 build-choice gate PASS')
