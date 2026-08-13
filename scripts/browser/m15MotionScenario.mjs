import { writeFile } from 'node:fs/promises'
import path from 'node:path'

export const M15_VIEWPORT = { width: 1440, height: 900 }

export function m15MotionPhase() {
  return process.env.M15_MOTION_PHASE === 'before' ? 'before' : 'after'
}

export function m15Query(phase = m15MotionPhase()) {
  return phase === 'before' ? '?m15Baseline=1&perfHud=1' : '?perfHud=1'
}

export async function soak(page, ms) {
  await page.waitForTimeout(ms)
}

export async function holdKeys(page, codes, ms) {
  for (const code of codes) await page.keyboard.down(code)
  await soak(page, ms)
  for (const code of [...codes].reverse()) await page.keyboard.up(code)
}

export async function captureCheckpoint(page, artifactDir, name) {
  if (!artifactDir) return
  await page.evaluate(() => window.__MOURNEVEIL_GATE__.pauseMotionTelemetry(true))
  await page.screenshot({
    path: path.join(artifactDir, 'frames', `${name}.png`),
    fullPage: false,
  })
  await page.evaluate(() => window.__MOURNEVEIL_GATE__.pauseMotionTelemetry(false))
}

export async function bootM15Page(page, baseUrl, phase = m15MotionPhase()) {
  const pageErrors = []
  page.on('pageerror', (error) => {
    pageErrors.push(String(error))
    console.error(`PAGE ERROR: ${error}`)
  })
  await page.goto(`${baseUrl}${m15Query(phase)}`, { waitUntil: 'load' })
  await page.waitForSelector('canvas', { timeout: 30_000 })
  await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
    timeout: 30_000,
  })
  await page.evaluate(() => {
    localStorage.removeItem('mourneveil.save.v4')
    localStorage.removeItem('mourneveil.save.v3')
    localStorage.removeItem('mourneveil.save.v2')
    localStorage.removeItem('mourneveil.save.v1')
  })
  await page.reload({ waitUntil: 'load' })
  await page.waitForSelector('canvas', { timeout: 30_000 })
  await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
    timeout: 30_000,
  })
  await soak(page, 700)
  await page.evaluate(() => {
    const g = window.__MOURNEVEIL_GATE__
    g.resetMeleeFixture()
    g.restorePlayer()
    g.setPlayerPosition({ x: -5.2, y: 0.82, z: 0.4 })
    g.setPlayerFacing({ x: 0, z: -1 })
  })
  await soak(page, 1200)
  await page.evaluate(() => window.__MOURNEVEIL_GATE__.resetMotionTelemetry())
  await soak(page, 400)
  await page.locator('canvas').click({ position: { x: 720, y: 450 } })
  await soak(page, 400)
  return pageErrors
}

/**
 * Real keyboard motion. Teleport only in bootM15Page.
 * Checkpoints match the M15 MB1 scenario list.
 */
export async function runM15MotionScript(page, artifactDir) {
  await soak(page, 800)
  await page.evaluate(() => window.__MOURNEVEIL_GATE__.resetMotionTelemetry())
  await soak(page, 250)
  const idleGaitBefore = await page.evaluate(() => window.__MOURNEVEIL_GATE__.locomotion())
  await soak(page, 400)
  const idleGait = await page.evaluate(() => window.__MOURNEVEIL_GATE__.locomotion())
  idleGait.phaseDelta = Math.abs((idleGait.gaitPhase ?? 0) - (idleGaitBefore.gaitPhase ?? 0))
  await captureCheckpoint(page, artifactDir, '01-idle')

  await holdKeys(page, ['KeyW'], 220)
  await captureCheckpoint(page, artifactDir, '01b-walk-start')

  await holdKeys(page, ['KeyW'], 1100)
  await captureCheckpoint(page, artifactDir, '02-straight')

  await holdKeys(page, ['KeyW', 'KeyD'], 900)
  await captureCheckpoint(page, artifactDir, '03-diagonal')

  await holdKeys(page, ['KeyS'], 1000)
  await captureCheckpoint(page, artifactDir, '04-reversal')

  for (let i = 0; i < 4; i += 1) {
    await holdKeys(page, [i % 2 === 0 ? 'KeyA' : 'KeyD'], 260)
  }
  await captureCheckpoint(page, artifactDir, '05-strafe')

  await holdKeys(page, ['KeyA'], 1000)
  const wallGait = await page.evaluate(() => window.__MOURNEVEIL_GATE__.locomotion())
  await captureCheckpoint(page, artifactDir, '06-wall-slide')

  await holdKeys(page, ['KeyW', 'KeyA'], 800)
  await captureCheckpoint(page, artifactDir, '07-corner')

  await holdKeys(page, ['KeyS', 'KeyA'], 1400)
  await captureCheckpoint(page, artifactDir, '08-corridor')

  await page.keyboard.press('Space')
  await soak(page, 500)
  await captureCheckpoint(page, artifactDir, '09-dodge')

  await holdKeys(page, ['KeyW'], 900)
  await captureCheckpoint(page, artifactDir, '10-combat-approach')

  await page.mouse.click(720, 450)
  await soak(page, 450)
  await captureCheckpoint(page, artifactDir, '11-attack')

  await holdKeys(page, ['KeyW'], 1800)
  await captureCheckpoint(page, artifactDir, '12-zone-transition')

  const endState = await page.evaluate(() => {
    const g = window.__MOURNEVEIL_GATE__
    return {
      telemetry: g.motionTelemetry(),
      renderer: g.rendererStats(),
      scene: g.sceneAudit(),
      camera: g.cameraDiagnostic(),
      zoneId: g.snapshot().world.currentZoneId,
      player: g.snapshot().player.position,
      presentation: g.snapshot().presentation,
      locomotion: g.locomotion(),
      placementAudit: g.placementAudit(),
      occluded: [...(g.occludedPlacementIds() ?? [])],
    }
  })
  return { ...endState, idleGait, wallGait }
}

export async function writeQualitySummary(artifactDir, summary) {
  if (!artifactDir) return
  await writeFile(path.join(artifactDir, 'quality-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
  await writeFile(path.join(artifactDir, 'telemetry.json'), `${JSON.stringify(summary.telemetry ?? {}, null, 2)}\n`)
  await writeFile(path.join(artifactDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
}

export function buildQualitySummary({
  phase,
  viewport,
  durationMs,
  pageErrors,
  collected,
}) {
  const telemetry = collected.telemetry
  return {
    phase,
    viewport,
    dpr: collected.renderer?.devicePixelRatio ?? 1,
    durationMs,
    fps: telemetry?.frames?.fps ?? 0,
    frame: telemetry?.frames ?? null,
    longFrames: {
      over20ms: telemetry?.frames?.framesOver20ms ?? 0,
      over25ms: telemetry?.frames?.framesOver25ms ?? 0,
      over33ms: telemetry?.frames?.framesOver33ms ?? 0,
    },
    camera: telemetry?.camera ?? null,
    playerScreen: {
      meanPlayerPixelHeight: telemetry?.camera?.meanPlayerPixelHeight ?? 0,
      screenXVariance: telemetry?.camera?.screenXVariance ?? 0,
      screenYVariance: telemetry?.camera?.screenYVariance ?? 0,
    },
    renderer: {
      drawCalls: collected.renderer?.drawCalls ?? telemetry?.renderer?.drawCalls ?? 0,
      triangles: collected.renderer?.triangles ?? telemetry?.renderer?.triangles ?? 0,
      sceneObjects: collected.renderer?.sceneObjectCount ?? telemetry?.renderer?.sceneObjects ?? 0,
      meshes: collected.renderer?.meshCount ?? telemetry?.renderer?.meshes ?? 0,
      lights: collected.renderer?.lightCount ?? 0,
    },
    scene: collected.scene ?? null,
    zoneId: collected.zoneId ?? null,
    pageErrors,
    resourceGrowth: {
      geometries: collected.renderer?.geometries ?? 0,
      textures: collected.renderer?.textures ?? 0,
    },
  }
}
