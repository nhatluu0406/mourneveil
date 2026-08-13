import { FIXED_STEP_SECONDS } from './fixedStepClock'
import type { Vector3Value } from '../character/playerMotor'

export interface PresentationTransform {
  readonly simulationPosition: Vector3Value
  readonly previousSimulationPosition: Vector3Value
  readonly renderAlpha: number
}

export function renderAlphaFromAccumulator(accumulatorSeconds: number): number {
  if (!Number.isFinite(accumulatorSeconds) || accumulatorSeconds <= 0) return 0
  return Math.max(0, Math.min(1, accumulatorSeconds / FIXED_STEP_SECONDS))
}

export function interpolateVector3(
  previous: Vector3Value,
  current: Vector3Value,
  alpha: number,
): Vector3Value {
  const t = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 0
  return {
    x: previous.x + (current.x - previous.x) * t,
    y: previous.y + (current.y - previous.y) * t,
    z: previous.z + (current.z - previous.z) * t,
  }
}

/** Visual pose: lerp(previous, current, alpha). Collision stays on `current`. */
export function presentationPositionFromTransform(
  transform: PresentationTransform,
): Vector3Value {
  return interpolateVector3(
    transform.previousSimulationPosition,
    transform.simulationPosition,
    transform.renderAlpha,
  )
}

export function presentationOffsetFromSimulation(
  simulationPosition: Vector3Value,
  presentedPosition: Vector3Value,
): Vector3Value {
  return {
    x: presentedPosition.x - simulationPosition.x,
    y: presentedPosition.y - simulationPosition.y,
    z: presentedPosition.z - simulationPosition.z,
  }
}
