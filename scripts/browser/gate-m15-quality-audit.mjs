import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { runOwnedBrowserGate, shouldKeepGateArtifacts } from './runtimeGateLifecycle.mjs'
import {
  M15_VIEWPORT,
  bootM15Page,
  buildQualitySummary,
  m15MotionPhase,
  runM15MotionScript,
  soak,
  writeQualitySummary,
} from './m15MotionScenario.mjs'

const PHASE = m15MotionPhase()
const OUT = 'tmp-m15-quality-audit'
const PORT = 4221
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
  recordVideo: keep,
  videoFileName: `${PHASE}.webm`,
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl, artifactDir }) => {
    const started = Date.now()
    if (artifactDir) await mkdir(path.join(artifactDir, 'frames'), { recursive: true })
    const pageErrors = await bootM15Page(page, baseUrl, PHASE)
    const heapBefore = await page.evaluate(() => window.__MOURNEVEIL_GATE__.rendererStats())
    await soak(page, 800)
    const collected = await runM15MotionScript(page, artifactDir)
    const heapAfter = collected.renderer
    const durationMs = Date.now() - started
    const summary = buildQualitySummary({
      phase: PHASE,
      viewport: M15_VIEWPORT,
      durationMs,
      pageErrors,
      collected,
    })
    summary.resourceGrowth = {
      geometries: (heapAfter?.geometries ?? 0) - (heapBefore?.geometries ?? 0),
      textures: (heapAfter?.textures ?? 0) - (heapBefore?.textures ?? 0),
      meshes: (heapAfter?.meshCount ?? 0) - (heapBefore?.meshCount ?? 0),
      lights: (heapAfter?.lightCount ?? 0) - (heapBefore?.lightCount ?? 0),
    }
    await writeQualitySummary(artifactDir, summary)
    console.log('M15 QUALITY:', JSON.stringify(summary, null, 2))

    summary.viewport.width === 1440 && summary.viewport.height === 900
      ? pass('viewport 1440×900')
      : fail(`viewport ${JSON.stringify(summary.viewport)}`)
    summary.frame && summary.frame.sampleCount >= 30
      ? pass(`frame samples ${summary.frame.sampleCount}`)
      : fail('missing frame samples')
    pageErrors.length === 0 ? pass('no page errors') : fail(`page errors: ${pageErrors.join(' | ')}`)
    summary.scene && summary.scene.total > 100
      ? pass(`scene placements ${summary.scene.total}`)
      : fail('scene audit missing')
    const lights = heapAfter?.lightCount ?? 0
    lights <= 12 && lights > 0
      ? pass(`light count ${lights}`)
      : fail(`light count ${lights}`)
    if ((summary.renderer.drawCalls ?? 0) > 450) fail(`drawCalls ${summary.renderer.drawCalls}`)
    else pass(`draw calls ${summary.renderer.drawCalls}`)
    if ((summary.renderer.sceneObjects ?? 0) > 900) fail(`objects ${summary.renderer.sceneObjects}`)
    else pass(`objects ${summary.renderer.sceneObjects}`)
  },
})

if (cleanupReport && !keep && cleanupReport.artifactCleanup?.kept) {
  fail('artifact dir kept without KEEP_ARTIFACTS')
}
if (failures.length > 0) {
  console.error(`FAIL: gate:m15-quality-audit (${failures.length})`)
  process.exit(1)
}
console.log(`PASS: gate:m15-quality-audit (${PHASE})`)
