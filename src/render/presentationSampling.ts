import type { Vector3Value } from '../game/character/playerMotor'
import { presentationPositionFromTransform } from '../game/core/presentationTransform'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { isM15Baseline } from '../debug/devQuery'

export function usesInterpolatedPresentation(search = window.location.search): boolean {
  return !isM15Baseline(search)
}

export function playerVisualPosition(
  runtime: GameRuntime,
  interpolate: boolean,
): Vector3Value {
  const snapshot = runtime.snapshot()
  if (!interpolate) return snapshot.player.position
  return presentationPositionFromTransform(snapshot.presentation)
}
