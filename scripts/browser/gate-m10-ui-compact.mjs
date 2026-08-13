import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery } from './freshSession.mjs'

/** Secondary compact viewport check for cinematic HUD regressions. */
const OUT = 'tmp-m10-ui-compact'
const PORT = 4198
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function settle(page, milliseconds = 700) {
  const slices = Math.ceil(milliseconds / 40)
  for (let index = 0; index < slices; index += 1) await page.waitForTimeout(40)
}

let cleanupReport = null
await runOwnedBrowserGate({
  port: PORT,
  artifactDir: OUT,
  viewport: { width: 1280, height: 720 },
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl }) => {
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(String(error)))

    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await page.evaluate(() => {
      const gate = window.__MOURNEVEIL_GATE__
      gate.resetMeleeFixture()
      gate.restorePlayer()
      gate.setPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
      gate.setPlayerFacing({ x: 0.2, z: -1 })
    })
    await settle(page, 900)

    const ui = await page.evaluate(() => {
      const status = document.querySelector('.gameplay-hud__status')
      const center = document.querySelector('.gameplay-hud__center')
      const equipment = document.querySelector('.gameplay-hud__equipment-bar')
      const location = document.querySelector('.gameplay-hud__location')
      const objective = document.querySelector('.gameplay-hud__objective')
      const threat = document.querySelector('.gameplay-hud__threat')
      const hint = document.querySelector('.dev-hint')
      const rect = (el) => {
        if (el === null) return null
        const box = el.getBoundingClientRect()
        return {
          top: box.top,
          left: box.left,
          right: box.right,
          bottom: box.bottom,
          width: box.width,
          height: box.height,
        }
      }
      const boxes = [location, objective, threat, status, center]
        .map((el) => rect(el))
        .filter((box) => box !== null && box.width > 0 && box.height > 0)
      let panelOverlap = false
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i]
          const b = boxes[j]
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
            panelOverlap = true
          }
        }
      }
      return {
        health: document.querySelector('.gameplay-hud__hp-text')?.textContent ?? null,
        equipmentVisible: equipment !== null && getComputedStyle(equipment).display !== 'none',
        equipmentCount: document.querySelectorAll('.gameplay-hud__equipment-slot').length,
        controlHintCount: document.querySelectorAll('.gameplay-hud__control-hints li').length,
        status: rect(status),
        center: rect(center),
        bodyOverflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
        hintVisible: hint !== null && getComputedStyle(hint).display !== 'none',
        panelOverlap,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      }
    })

    ui.viewport.width === 1280 && ui.viewport.height === 720
      ? pass('viewport locked at 1280x720')
      : fail(`unexpected viewport ${ui.viewport.width}x${ui.viewport.height}`)
    ui.health && /\d+\/\d+/.test(ui.health)
      ? pass(`compact HUD health readable (${ui.health})`)
      : fail(`compact HUD health missing: ${ui.health}`)
    ui.equipmentVisible && ui.equipmentCount === 4
      ? pass('compact HUD keeps four content slots visible')
      : fail(`compact equipment slots=${ui.equipmentCount}`)
    ui.controlHintCount === 3 ? pass('compact secondary hints present') : fail(`control hints=${ui.controlHintCount}`)
    !ui.bodyOverflowX ? pass('no horizontal document overflow') : fail('horizontal overflow at 1280x720')
    !ui.hintVisible ? pass('product presentation has no F3 hint') : fail('F3 hint visible')
    !ui.panelOverlap ? pass('HUD panels do not overlap') : fail('HUD panels overlap at 1280x720')

    if (ui.status && ui.center) {
      pass('status and action dock measured')
    } else {
      fail('status/center boxes missing')
    }

    await page.screenshot({ path: `${OUT}/01-compact-product-ui.png`, fullPage: false })
    pageErrors.length === 0 ? pass('no uncaught page errors') : fail(pageErrors.join(' | '))
  },
})

if (
  cleanupReport === null ||
  !cleanupReport.pageClosed ||
  !cleanupReport.browserClosed ||
  !cleanupReport.serverExited ||
  !cleanupReport.portReusable
) {
  fail(`owned cleanup failed: ${JSON.stringify(cleanupReport)}`)
} else {
  pass(`browser/server closed; port ${PORT} reusable`)
  pass(cleanupReport.artifactCleanup?.kept ? `review artifacts kept at ${OUT}` : 'artifacts cleaned')
}

if (failures.length > 0) throw new Error(failures.join('\n'))
console.log('\nM10 compact UI gate PASS')
