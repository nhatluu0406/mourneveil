import { summarizeFrameDeltas, type FrameDeltaSummary } from './frameMetrics'

export interface MotionSample {
  readonly timeMs: number
  readonly rafDeltaMs: number
  readonly simSteps: number
  readonly discardedSeconds: number
  readonly simX: number
  readonly simY: number
  readonly simZ: number
  readonly presX: number
  readonly presY: number
  readonly presZ: number
  readonly camX: number
  readonly camY: number
  readonly camZ: number
  readonly lookX: number
  readonly lookY: number
  readonly lookZ: number
  readonly lookAheadX: number
  readonly lookAheadZ: number
  readonly screenX: number
  readonly screenY: number
  readonly playerPixelHeight: number
  readonly impulseMeters: number
  readonly drawCalls: number
  readonly triangles: number
  readonly sceneObjects: number
  readonly meshes: number
}

export interface CameraMotionSummary {
  readonly maxCameraStepMeters: number
  readonly maxLookAtStepMeters: number
  readonly maxCameraAccelMeters: number
  readonly reversalSpikes: number
  readonly screenXVariance: number
  readonly screenYVariance: number
  readonly meanPlayerPixelHeight: number
  readonly maxImpulseMeters: number
  readonly meanSimStepsPerFrame: number
  readonly discardedSeconds: number
}

export interface MotionTelemetrySummary {
  readonly frames: FrameDeltaSummary
  readonly camera: CameraMotionSummary
  readonly renderer: {
    readonly drawCalls: number
    readonly triangles: number
    readonly sceneObjects: number
    readonly meshes: number
  }
}

const RING_CAPACITY = 1800
const ring: MotionSample[] = []
let writeIndex = 0
let filled = 0
let lastPublishMs = 0
let published: MotionTelemetrySummary | null = null
let paused = false
let skipSamples = 0

export function resetMotionTelemetry(): void {
  writeIndex = 0
  filled = 0
  lastPublishMs = 0
  published = null
  paused = false
  skipSamples = 0
}

export function setMotionTelemetryPaused(next: boolean): void {
  if (paused && !next) skipSamples = 2
  paused = next
}

export function pushMotionSample(sample: MotionSample): void {
  if (paused) return
  if (skipSamples > 0) {
    skipSamples -= 1
    return
  }
  if (ring.length < RING_CAPACITY) ring.push(sample)
  else ring[writeIndex] = sample
  writeIndex = (writeIndex + 1) % RING_CAPACITY
  filled = Math.min(RING_CAPACITY, filled + 1)
}

function samples(): MotionSample[] {
  if (filled < RING_CAPACITY) return ring.slice(0, filled)
  return [...ring.slice(writeIndex), ...ring.slice(0, writeIndex)]
}

function variance(values: readonly number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
}

export function summarizeMotionSamples(list: readonly MotionSample[]): MotionTelemetrySummary {
  const frames = summarizeFrameDeltas(list.map((sample) => sample.rafDeltaMs))
  let maxCameraStepMeters = 0
  let maxLookAtStepMeters = 0
  let maxCameraAccelMeters = 0
  let reversalSpikes = 0
  let previousCamDelta: { dx: number; dz: number; step: number } | null = null
  let discardedSeconds = 0
  let simSteps = 0
  for (let i = 1; i < list.length; i += 1) {
    const prev = list[i - 1]!
    const cur = list[i]!
    const camStep = Math.hypot(cur.camX - prev.camX, cur.camY - prev.camY, cur.camZ - prev.camZ)
    const lookStep = Math.hypot(cur.lookX - prev.lookX, cur.lookY - prev.lookY, cur.lookZ - prev.lookZ)
    discardedSeconds += cur.discardedSeconds
    simSteps += cur.simSteps
    if (lookStep > 3 || camStep > 4) continue
    maxCameraStepMeters = Math.max(maxCameraStepMeters, camStep)
    maxLookAtStepMeters = Math.max(maxLookAtStepMeters, lookStep)
    const dx = cur.camX - prev.camX
    const dz = cur.camZ - prev.camZ
    if (previousCamDelta !== null) {
      maxCameraAccelMeters = Math.max(
        maxCameraAccelMeters,
        Math.abs(camStep - previousCamDelta.step),
      )
      const dot = previousCamDelta.dx * dx + previousCamDelta.dz * dz
      if (dot < -1e-6 && previousCamDelta.step > 0.03 && camStep > 0.03) reversalSpikes += 1
    }
    previousCamDelta = { dx, dz, step: camStep }
  }
  const last = list[list.length - 1]
  return {
    frames,
    camera: {
      maxCameraStepMeters,
      maxLookAtStepMeters,
      maxCameraAccelMeters,
      reversalSpikes,
      screenXVariance: variance(list.map((sample) => sample.screenX)),
      screenYVariance: variance(list.map((sample) => sample.screenY)),
      meanPlayerPixelHeight:
        list.length === 0
          ? 0
          : list.reduce((sum, sample) => sum + sample.playerPixelHeight, 0) / list.length,
      maxImpulseMeters: list.reduce((max, sample) => Math.max(max, sample.impulseMeters), 0),
      meanSimStepsPerFrame: list.length === 0 ? 0 : simSteps / list.length,
      discardedSeconds,
    },
    renderer: {
      drawCalls: last?.drawCalls ?? 0,
      triangles: last?.triangles ?? 0,
      sceneObjects: last?.sceneObjects ?? 0,
      meshes: last?.meshes ?? 0,
    },
  }
}

/** Publish at most 4 Hz for HUD; gates may read the latest ring summary anytime. */
export function publishMotionTelemetryIfDue(nowMs: number, intervalMs = 250): MotionTelemetrySummary {
  const summary = summarizeMotionSamples(samples())
  if (nowMs - lastPublishMs >= intervalMs) {
    lastPublishMs = nowMs
    published = summary
  }
  return published ?? summary
}

export function readMotionTelemetry(): MotionTelemetrySummary | null {
  if (published !== null) return published
  if (filled === 0) return null
  return summarizeMotionSamples(samples())
}

export function captureMotionTelemetry(): MotionTelemetrySummary {
  return summarizeMotionSamples(samples())
}
