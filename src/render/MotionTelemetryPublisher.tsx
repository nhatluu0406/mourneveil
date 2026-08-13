import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3 } from 'three'
import { readCameraDiagnostic } from '../debug/cameraDiagnosticPublish'
import {
  pushMotionSample,
  publishMotionTelemetryIfDue,
} from '../debug/motionTelemetry'
import { readRendererStats } from '../debug/rendererStats'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { playerVisualPosition, usesInterpolatedPresentation } from './presentationSampling'

const scratchPres = new Vector3()
const scratchHead = new Vector3()
const scratchFeet = new Vector3()

/**
 * Samples motion/frame telemetry from the R3F loop. No React setState.
 */
export function MotionTelemetryPublisher({ runtime }: { readonly runtime: GameRuntime }) {
  const { camera, size, gl } = useThree()
  const interpolateRef = useRef(usesInterpolatedPresentation())
  const lastStepRef = useRef(0)

  useFrame((_, delta) => {
    const now = performance.now()
    const snapshot = runtime.snapshot()
    const sim = snapshot.player.position
    const presented = playerVisualPosition(runtime, interpolateRef.current)
    const diagnostic = readCameraDiagnostic()
    const stats = readRendererStats()
    const lastFrame = runtime.lastSimulationFrame()
    const steps = snapshot.simulation.stepCount - lastStepRef.current
    lastStepRef.current = snapshot.simulation.stepCount

    scratchPres.set(presented.x, presented.y + 0.55, presented.z).project(camera)
    scratchHead.set(presented.x, presented.y + 1.55, presented.z).project(camera)
    scratchFeet.set(presented.x, presented.y, presented.z).project(camera)
    const screenX = (scratchPres.x * 0.5 + 0.5) * size.width
    const screenY = (-scratchPres.y * 0.5 + 0.5) * size.height
    const playerPixelHeight = Math.abs(scratchHead.y - scratchFeet.y) * 0.5 * size.height

    pushMotionSample({
      timeMs: now,
      rafDeltaMs: Math.max(0, delta * 1000),
      simSteps: lastFrame?.stepsExecuted ?? Math.max(0, steps),
      discardedSeconds: lastFrame?.discardedTimeSeconds ?? 0,
      simX: sim.x,
      simY: sim.y,
      simZ: sim.z,
      presX: presented.x,
      presY: presented.y,
      presZ: presented.z,
      camX: camera.position.x,
      camY: camera.position.y,
      camZ: camera.position.z,
      lookX: diagnostic?.followLookAt.x ?? presented.x,
      lookY: diagnostic?.followLookAt.y ?? presented.y,
      lookZ: diagnostic?.followLookAt.z ?? presented.z,
      lookAheadX: diagnostic?.lookAheadDir.x ?? 0,
      lookAheadZ: diagnostic?.lookAheadDir.z ?? -1,
      screenX,
      screenY,
      playerPixelHeight,
      impulseMeters: diagnostic?.impulseMeters ?? 0,
      drawCalls: gl.info.render.calls || stats?.drawCalls || 0,
      triangles: gl.info.render.triangles || stats?.triangles || 0,
      sceneObjects: stats?.sceneObjectCount ?? 0,
      meshes: stats?.meshCount ?? 0,
    })
    publishMotionTelemetryIfDue(now)
  })

  return null
}
