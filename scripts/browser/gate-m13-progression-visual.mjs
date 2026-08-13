import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery } from './freshSession.mjs'

const OUT = 'tmp-m13-progression-visual'
const PORT = 4210
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => { failures.push(message); console.error(`FAIL: ${message}`) }

async function settle(page, milliseconds = 450) {
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 40) await page.waitForTimeout(40)
}

async function capture(page, artifactDir, name) {
  await settle(page)
  await page.screenshot({ path: `${artifactDir}/${name}.png`, fullPage: false })
}

let cleanupReport = null
await runOwnedBrowserGate({
  artifactDir: OUT,
  port: PORT,
  viewport: { width: 1440, height: 900 },
  afterCleanup: (report) => { cleanupReport = report },
  run: async (page, { baseUrl, artifactDir }) => {
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(String(error)))
    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await page.evaluate(() => {
      localStorage.removeItem('mourneveil.save.v4')
      localStorage.removeItem('mourneveil.save.v3')
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      g.setPlayerPosition({ x: 1.25, y: 0.82, z: -4.45 })
      g.setPlayerFacing({ x: 0.55, z: -0.84 })
      g.advance(2)
    })
    await capture(page, artifactDir, '01-court-gameplay')

    await page.evaluate(() => window.__MOURNEVEIL_GATE__.defeatEnemy('enemy.skirmisher.1'))
    await capture(page, artifactDir, '02-xp-gain')
    await page.evaluate(() => window.__MOURNEVEIL_GATE__.defeatEnemy('enemy.skirmisher.pressure'))
    await capture(page, artifactDir, '03-level-up')

    await page.keyboard.press('i')
    await page.waitForSelector('[data-progression-panel="1"]')
    await capture(page, artifactDir, '04-progression-panel-point-available')
    const available = await page.evaluate(() => ({
      pointText: document.querySelector('[data-progression-panel="1"]')?.textContent ?? null,
      buttons: [...document.querySelectorAll('[data-attribute] button')].filter((button) => !button.disabled).length,
    }))
    available.pointText?.includes('Unspent') && available.buttons > 0
      ? pass('progression point and valid allocation affordance visible')
      : fail(`point allocation affordance missing ${JSON.stringify(available)}`)

    await page.locator('[data-attribute="vitality"] button').click()
    await capture(page, artifactDir, '05-vitality-allocation')
    const vitality = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    vitality.progression.allocation.vitality === 1 && vitality.playerHealth.health.maximum === 110
      ? pass('Vitality allocation projects authoritative +10 HP')
      : fail(`Vitality projection mismatch ${JSON.stringify(vitality.progression)}`)

    await page.keyboard.press('i')
    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      const wardLoot = g.snapshot().lootPickup
      if (wardLoot.position === null) throw new Error('Ward loot position missing')
      g.setPlayerPosition(wardLoot.position); g.advance(8)
      g.defeatEnemy('enemy.brute.1')
      const loot = g.snapshot().lootPickup
      if (loot.position === null) throw new Error('Vitality loot position missing')
      g.setPlayerPosition(loot.position); g.advance(8)
      g.defeatEnemy('enemy.boss.sepulchre.1')
      g.setPlayerPosition({ x: 1.25, y: 0.82, z: -4.45 }); g.advance(2)
    })
    await page.keyboard.press('i')
    await page.waitForSelector('[data-progression-panel="1"]')
    await page.locator('[data-attribute="resolve"] button').click()
    await capture(page, artifactDir, '06-resolve-allocation')
    const resolve = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    resolve.progression.allocation.resolve === 1 && resolve.defense.guardImpactThreshold === 4
      ? pass('Resolve allocation projects authoritative guard threshold')
      : fail(`Resolve projection mismatch ${JSON.stringify(resolve.progression)}`)

    const wardOwned = resolve.inventory.entries.some((entry) => entry.itemId === 'item.charm.ward-seal')
    const vitalityOwned = resolve.inventory.entries.some((entry) => entry.itemId === 'item.charm.vitality')
    wardOwned && vitalityOwned ? pass('both canonical charm choices available') : fail('charm comparison inventory incomplete')
    await page.locator('[data-item-id="item.charm.vitality"]').screenshot({ path: `${artifactDir}/07-vitality-charm-comparison.png` })
    await page.locator('[data-item-id="item.charm.ward-seal"]').screenshot({ path: `${artifactDir}/08-ward-seal-comparison.png` })
    const panelEvidence = await page.evaluate(() => {
      const panel = document.querySelector('.inventory-panel--build')
      const owned = document.querySelector('[data-inventory-scroll="1"]')
      const skills = document.querySelector('[data-skill-loadout="1"]')
      const style = panel ? getComputedStyle(panel) : null
      const ownedStyle = owned ? getComputedStyle(owned) : null
      return {
        vitality: document.querySelector('[data-item-id="item.charm.vitality"] .inventory-item-glyph')?.innerHTML ?? '',
        ward: document.querySelector('[data-item-id="item.charm.ward-seal"] .inventory-item-glyph')?.innerHTML ?? '',
        skillLoadout: Boolean(skills),
        skillCards: document.querySelectorAll('[data-skill-id]').length,
        panelOverflowY: style?.overflowY ?? null,
        ownedOverflowY: ownedStyle?.overflowY ?? null,
        panelScrollHeight: panel?.scrollHeight ?? 0,
        panelClientHeight: panel?.clientHeight ?? 0,
        ownedScrollHeight: owned?.scrollHeight ?? 0,
        ownedClientHeight: owned?.clientHeight ?? 0,
        documentScrollHeight: document.documentElement.scrollHeight,
        documentClientHeight: document.documentElement.clientHeight,
        bodyScrollHeight: document.body.scrollHeight,
        bodyClientHeight: document.body.clientHeight,
        innerWidth: window.innerWidth,
        documentClientWidth: document.documentElement.clientWidth,
        overflowOwners: [...document.querySelectorAll('*')].filter((element) => {
          const computed = getComputedStyle(element)
          return ['auto', 'scroll'].includes(computed.overflowY) && element.scrollHeight > element.clientHeight + 1
        }).map((element) => ({ className: element.className, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight })),
      }
    })
    panelEvidence.vitality !== panelEvidence.ward ? pass('Vitality and Ward use distinct authored glyphs') : fail('charm glyphs are not distinct')
    panelEvidence.skillLoadout && panelEvidence.skillCards >= 3
      ? pass('active skill loadout visible with three skill cards')
      : fail(`skill loadout missing ${JSON.stringify(panelEvidence)}`)
    panelEvidence.panelOverflowY === 'hidden' &&
      panelEvidence.documentScrollHeight <= panelEvidence.documentClientHeight + 1 &&
      panelEvidence.bodyScrollHeight <= panelEvidence.bodyClientHeight + 1 &&
      panelEvidence.panelScrollHeight <= panelEvidence.panelClientHeight + 1 &&
      panelEvidence.ownedScrollHeight <= panelEvidence.ownedClientHeight + 1 &&
      panelEvidence.innerWidth === panelEvidence.documentClientWidth &&
      panelEvidence.overflowOwners.length === 0
      ? pass('1440×900 document, panel, and owned regions fit without a scrollbar')
      : fail(`scrollbar policy fail @1440 ${JSON.stringify(panelEvidence)}`)
    await capture(page, artifactDir, '08b-skill-loadout')

    await page.keyboard.press('i')
    await page.evaluate(() => { const g = window.__MOURNEVEIL_GATE__; g.setPlayerPosition({ x: 2.5, y: 0.82, z: -5.45 }); g.setPlayerFacing({ x: 0.7, z: 0.7 }); g.advance(2) })
    await capture(page, artifactDir, '09-court-practical-light-route')

    const captureSkill = async (skillId, startupAdvance, name) => {
      await page.evaluate(({ skillId, startupAdvance }) => {
        const g = window.__MOURNEVEIL_GATE__
        while (g.snapshot().combat.phase !== 'idle') g.advance(1)
        const remaining = g.snapshot().skills.cooldownRemainingSteps
        if (remaining > 0) g.advance(remaining + 1)
        const equipped = g.equipSkill(skillId)
        if (equipped?.accepted !== true && g.snapshot().skills.equippedSkillId !== skillId) throw new Error(`skill equip failed ${skillId}`)
        const result = g.useSkill()
        if (result?.accepted !== true) throw new Error(`skill activation failed ${skillId}: ${JSON.stringify(result)}`)
        g.advance(startupAdvance)
      }, { skillId, startupAdvance })
      // One render frame lets R3F project the fixed-step snapshot without allowing
      // the real-time loop to run through the short authoritative skill action.
      await page.waitForTimeout(24)
      await page.screenshot({ path: `${artifactDir}/${name}.png`, fullPage: false })
    }
    await captureSkill('skill.veil-step', 4, '10-veil-step-fracture')
    await captureSkill('skill.oath-cleave', 14, '11-oath-cleave-arc')
    await captureSkill('skill.ward-pulse', 4, '12-ward-pulse-facets')
    await page.evaluate(() => { const g = window.__MOURNEVEIL_GATE__; while (g.snapshot().combat.phase !== 'idle') g.advance(1) })
    await capture(page, artifactDir, '13-skill-cooldown-hud')
    await page.evaluate(() => { const g = window.__MOURNEVEIL_GATE__; g.setPlayerPosition({ x: -5.8, y: 0.82, z: 0.3 }); g.setPlayerFacing({ x: 0.4, z: -0.9 }); g.advance(2) })
    await capture(page, artifactDir, '14-warden-refuge-art')
    await page.evaluate(() => { const g = window.__MOURNEVEIL_GATE__; g.resetMeleeFixture(); g.setPlayerPosition({ x: 0.9, y: 0.82, z: -4.3 }); g.setPlayerFacing({ x: -0.5, z: -0.86 }); g.advance(3) })
    await capture(page, artifactDir, '15-court-combat-readability')

    await page.setViewportSize({ width: 1280, height: 720 })
    await page.keyboard.press('i')
    await page.waitForSelector('[data-progression-panel="1"]')
    await capture(page, artifactDir, '16-progression-panel-1280x720')
    const compactEvidence = await page.evaluate(() => {
      const panel = document.querySelector('.inventory-panel--build')
      const owned = document.querySelector('[data-inventory-scroll="1"]')
      const skills = document.querySelector('[data-skill-loadout="1"]')
      return {
        skillVisible: Boolean(skills?.getBoundingClientRect().height),
        ownedOverflowY: owned ? getComputedStyle(owned).overflowY : null,
        panelOverflowY: panel ? getComputedStyle(panel).overflowY : null,
        bodyScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1 || document.body.scrollHeight > document.body.clientHeight + 1,
        panelFits: panel ? panel.scrollHeight <= panel.clientHeight + 1 : false,
        overflowOwners: [...document.querySelectorAll('*')].filter((element) => {
          const computed = getComputedStyle(element)
          return ['auto', 'scroll'].includes(computed.overflowY) && element.scrollHeight > element.clientHeight + 1
        }).map((element) => element.getAttribute('data-inventory-scroll') === '1' ? 'owned-relics' : element.className),
      }
    })
    !compactEvidence.bodyScroll && compactEvidence.skillVisible && compactEvidence.panelFits && compactEvidence.overflowOwners.every((owner) => owner === 'owned-relics')
      ? pass('1280×720 content accessible without page scroll')
      : fail(`1280×720 accessibility fail ${JSON.stringify(compactEvidence)}`)
    compactEvidence.panelOverflowY === 'hidden'
      ? pass('1280×720 panel keeps native page/panel scrollbar suppressed')
      : fail(`1280 panel overflow ${compactEvidence.panelOverflowY}`)
    await page.keyboard.press('i')
    await capture(page, artifactDir, '17-combat-hud-1280x720')

    const stats = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
    console.log('M13 VISUAL METRICS:', JSON.stringify(stats, null, 2))
    stats?.lightCount <= 12 ? pass(`light budget bounded (${stats.lightCount})`) : fail(`light count ${stats?.lightCount}`)
    pageErrors.length === 0 ? pass('no page errors') : fail(pageErrors.join(' | '))
    if (failures.length > 0) throw new Error(`${failures.length} M13 visual gate failure(s)`)
  },
})

if (!cleanupReport?.portReusable) throw new Error(`port ${PORT} was not reusable`)
pass(`owned artifacts ${process.env.KEEP_ARTIFACTS === '1' ? 'kept' : 'removed'}; port ${PORT} reusable`)
console.log('\nM13 progression visual gate PASS')
