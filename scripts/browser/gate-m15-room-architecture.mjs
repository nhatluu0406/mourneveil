import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { runOwnedBrowserGate, shouldKeepGateArtifacts } from './runtimeGateLifecycle.mjs'
import { M15_VIEWPORT, soak } from './m15MotionScenario.mjs'
import { withFreshQuery } from './freshSession.mjs'

const OUT = 'tmp-m15-room-redesign'
const PORT = 4223
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
    await page.goto(withFreshQuery(baseUrl, '?perfHud=1'), { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await soak(page, 900)

    const shots = [
      { name: '03-refuge-final', position: { x: -5.2, y: 0.82, z: 0.4 }, facing: { x: 0, z: -1 } },
      { name: '04-corridor', position: { x: -5.5, y: 0.82, z: -3.6 }, facing: { x: 1, z: 0 } },
      { name: '05-court', position: { x: -1, y: 0.82, z: -4 }, facing: { x: 1, z: 0 } },
      { name: '06-mixed', position: { x: 2.4, y: 0.82, z: -4.1 }, facing: { x: 1, z: 0 } },
      { name: '07-ash-walk', position: { x: 5.5, y: 0.82, z: -4.1 }, facing: { x: 1, z: 0 } },
      { name: '08-final-approach', position: { x: 8.4, y: 0.82, z: -4.1 }, facing: { x: 1, z: 0 } },
      { name: '09-sepulchre', position: { x: 13, y: 0.82, z: -4 }, facing: { x: -1, z: 0 } },
      { name: '10-camera-near-wall', position: { x: -4.2, y: 0.82, z: -3.6 }, facing: { x: 1, z: 0 } },
      { name: '12-combat-room', position: { x: -9.15, y: 0.82, z: 2.15 }, facing: { x: 1, z: 0 } },
    ]

    for (const shot of shots) {
      await page.evaluate(({ position, facing }) => {
        const g = window.__MOURNEVEIL_GATE__
        g.resetMeleeFixture()
        g.restorePlayer()
        g.setPlayerPosition(position)
        g.setPlayerFacing(facing)
      }, shot)
      await soak(page, 650)
      if (artifactDir) {
        await page.screenshot({
          path: path.join(artifactDir, 'frames', `${shot.name}.png`),
          fullPage: false,
        })
      }
      pass(`captured ${shot.name}`)
    }

    await page.evaluate(() => {
      window.__MOURNEVEIL_GATE__.setPlayerPosition({ x: -5.2, y: 0.82, z: 0.4 })
    })
    await page.keyboard.down('KeyW')
    await soak(page, 700)
    await page.keyboard.up('KeyW')
    if (artifactDir) {
      await page.screenshot({
        path: path.join(artifactDir, 'frames', '11-player-walk.png'),
        fullPage: false,
      })
    }

    const collected = await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      return {
        renderer: g.rendererStats(),
        audit: g.placementAudit(),
        scene: g.sceneAudit(),
        occluded: [...(g.occludedPlacementIds() ?? [])],
      }
    })
    const unsupported = collected.audit?.unsupportedOrdinary ?? []
    unsupported.length === 0
      ? pass('placement audit clean')
      : fail(`unsupported ${unsupported.map((entry) => entry.id).join(',')}`)
    const occludedArchitecture = collected.occluded.filter(
      (id) => id !== 'gate.shortcut' && id !== 'gate.final',
    )
    occludedArchitecture.length === 0
      ? pass('no architecture fade')
      : fail(`occluded ${occludedArchitecture.join(',')}`)
    const objects = collected.renderer?.sceneObjectCount ?? 0
    const meshes = collected.renderer?.meshCount ?? 0
    objects <= 440 ? pass(`scene objects ${objects}`) : fail(`scene objects ${objects} > 440`)
    meshes <= 250 ? pass(`meshes ${meshes}`) : fail(`meshes ${meshes} > 250`)
    if (artifactDir) {
      await writeFile(
        path.join(artifactDir, 'world-placement-audit.json'),
        `${JSON.stringify(collected.audit, null, 2)}\n`,
      )
    }
    pageErrors.length === 0 ? pass('no page errors') : fail(pageErrors.join(' | '))
  },
})

if (cleanupReport && !keep && cleanupReport.artifactCleanup?.kept) {
  fail('artifact dir kept without KEEP_ARTIFACTS')
}
if (failures.length > 0) {
  console.error(`FAIL: gate:m15-room-architecture (${failures.length})`)
  process.exit(1)
}
console.log('PASS: gate:m15-room-architecture')
