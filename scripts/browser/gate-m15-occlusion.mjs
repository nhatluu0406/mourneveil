import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { runOwnedBrowserGate, shouldKeepGateArtifacts } from './runtimeGateLifecycle.mjs'
import { M15_VIEWPORT, soak } from './m15MotionScenario.mjs'

const OUT = 'tmp-m15-occlusion'
const PORT = 4222
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

const keep = shouldKeepGateArtifacts()
let cleanupReport = null
await runOwnedBrowserGate({
  artifactDir: OUT,
  port: PORT,
  viewport: M15_VIEWPORT,
  deviceScaleFactor: 1,
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl, artifactDir }) => {
    if (artifactDir) await mkdir(path.join(artifactDir, 'frames'), { recursive: true })
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(String(error)))
    await page.goto(`${baseUrl}?perfHud=1`, { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await soak(page, 800)

    const probes = [
      { name: 'wall', position: { x: -7.4, y: 0.82, z: 0 }, facing: { x: -1, z: 0 } },
      { name: 'column-space', position: { x: -10.1, y: 0.82, z: 2.2 }, facing: { x: 1, z: 0 } },
      { name: 'arch-corridor', position: { x: -5.5, y: 0.82, z: -4.6 }, facing: { x: 0, z: -1 } },
      { name: 'sarcophagus', position: { x: -7.2, y: 0.82, z: 1.2 }, facing: { x: 0, z: 1 } },
      { name: 'divider', position: { x: -4.2, y: 0.82, z: -3.6 }, facing: { x: 1, z: 0 } },
    ]

    const allowed = new Set(['gate.shortcut', 'gate.final'])
    for (const probe of probes) {
      await page.evaluate(({ position, facing }) => {
        const g = window.__MOURNEVEIL_GATE__
        g.resetMeleeFixture()
        g.restorePlayer()
        g.setPlayerPosition(position)
        g.setPlayerFacing(facing)
      }, probe)
      await soak(page, 700)
      if (artifactDir) {
        await page.screenshot({
          path: path.join(artifactDir, 'frames', `${probe.name}.png`),
          fullPage: false,
        })
      }
      const occluded = await page.evaluate(() => [...(window.__MOURNEVEIL_GATE__.occludedPlacementIds() ?? [])])
      const leaked = occluded.filter((id) => !allowed.has(id))
      leaked.length === 0
        ? pass(`${probe.name} architecture opaque (${occluded.join(',') || 'none'})`)
        : fail(`${probe.name} faded ordinary architecture: ${leaked.join(',')}`)
    }

    const fadeIds = await page.evaluate(() => window.__MOURNEVEIL_GATE__.placementAudit())
    const fadeDefs = (fadeIds.entries ?? []).filter((entry) => entry.objectId && false)
    void fadeDefs
    pageErrors.length === 0 ? pass('no page errors') : fail(pageErrors.join(' | '))
  },
})

if (cleanupReport && !keep && cleanupReport.artifactCleanup?.kept) {
  fail('artifact dir kept without KEEP_ARTIFACTS')
}
if (failures.length > 0) {
  console.error(`FAIL: gate:m15-occlusion (${failures.length})`)
  process.exit(1)
}
console.log('PASS: gate:m15-occlusion')
