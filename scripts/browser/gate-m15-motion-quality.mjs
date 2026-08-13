import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { runOwnedBrowserGate, shouldKeepGateArtifacts } from './runtimeGateLifecycle.mjs'
import {
  M15_VIEWPORT,
  bootM15Page,
  buildQualitySummary,
  m15MotionPhase,
  runM15MotionScript,
  writeQualitySummary,
} from './m15MotionScenario.mjs'

const PHASE = m15MotionPhase()
const OUT = 'tmp-m15-motion-quality'
const PORT = 4220
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
    const collected = await runM15MotionScript(page, artifactDir)
    const durationMs = Date.now() - started
    const summary = buildQualitySummary({
      phase: PHASE,
      viewport: M15_VIEWPORT,
      durationMs,
      pageErrors,
      collected,
    })
    await writeQualitySummary(artifactDir, summary)
    console.log('M15 MOTION:', JSON.stringify({
      phase: PHASE,
      fps: summary.fps,
      p95: summary.frame?.p95Ms,
      reversal: summary.camera?.reversalSpikes,
      playerPx: summary.playerScreen.meanPlayerPixelHeight,
      calls: summary.renderer.drawCalls,
      objects: summary.renderer.sceneObjects,
    }))

    summary.frame && summary.frame.sampleCount >= 30
      ? pass(`sampled ${summary.frame.sampleCount} frames`)
      : fail(`insufficient motion samples (${summary.frame?.sampleCount ?? 0})`)
    pageErrors.length === 0 ? pass('no page errors') : fail(`page errors: ${pageErrors.join(' | ')}`)
    const lookAtSettled = summary.camera
      ? summary.camera.maxLookAtStepMeters
      : 0
    lookAtSettled <= 2.8
      ? pass(`lookAt step bounded (${lookAtSettled.toFixed(3)})`)
      : fail(`lookAt step too large (${lookAtSettled.toFixed(3)})`)
    const idleDelta = collected.idleGait?.phaseDelta ?? collected.idleGait?.gaitPhase ?? 0
    idleDelta <= 0.05
      ? pass(`idle gait phase frozen (delta=${idleDelta})`)
      : fail(`idle gait still advancing (${idleDelta})`)
    const occluded = collected.occluded ?? []
    occluded.length === 0
      ? pass('no architecture fade IDs during motion')
      : fail(`occluded placements: ${occluded.join(',')}`)
    const unsupported = collected.placementAudit?.unsupportedOrdinary ?? []
    unsupported.length === 0
      ? pass('no unsupported ordinary placements')
      : fail(`unsupported: ${unsupported.map((e) => e.id).join(',')}`)
    if ((summary.renderer.drawCalls ?? 0) > 450) fail(`drawCalls ${summary.renderer.drawCalls}`)
    else pass(`draw calls ${summary.renderer.drawCalls}`)
  },
})

if (cleanupReport && !keep && cleanupReport.artifactCleanup?.kept) {
  fail('artifact dir kept without KEEP_ARTIFACTS')
}
if (failures.length > 0) {
  console.error(`FAIL: gate:m15-motion-quality (${failures.length})`)
  process.exit(1)
}
console.log(`PASS: gate:m15-motion-quality (${PHASE})`)
