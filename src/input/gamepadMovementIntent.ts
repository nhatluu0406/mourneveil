import type { PlayerMovementIntent } from './playerMovementIntent'

/** Small left-stick dead zone. Axes inside this radius are treated as neutral. */
export const GAMEPAD_LEFT_STICK_DEAD_ZONE = 0.18

const NEUTRAL_INTENT: PlayerMovementIntent = Object.freeze({
  horizontal: 0,
  forward: 0,
})

/**
 * Convert Gamepad API left-stick axes into semantic movement intent.
 * Browser convention: axes[0] right+, axes[1] down+. Stick up → forward+.
 */
export function leftStickAxesToMovementIntent(
  axisX: number,
  axisY: number,
  deadZone: number = GAMEPAD_LEFT_STICK_DEAD_ZONE,
): PlayerMovementIntent {
  if (![axisX, axisY, deadZone].every(Number.isFinite) || deadZone < 0) {
    return NEUTRAL_INTENT
  }

  const horizontal = axisX
  const forward = -axisY
  const magnitude = Math.hypot(horizontal, forward)

  if (magnitude <= deadZone) {
    return NEUTRAL_INTENT
  }

  // Rescale from dead-zone edge to 1 so leaving the dead zone is progressive.
  const rescaledMagnitude = Math.min(1, (magnitude - deadZone) / (1 - deadZone))
  const scale = rescaledMagnitude / magnitude
  return {
    horizontal: normalizeZero(horizontal * scale),
    forward: normalizeZero(forward * scale),
  }
}

function normalizeZero(value: number): number {
  return value === 0 ? 0 : value
}

export function isNeutralMovementIntent(
  intent: PlayerMovementIntent,
): boolean {
  return intent.horizontal === 0 && intent.forward === 0
}

export function normalizeMovementIntent(
  intent: PlayerMovementIntent,
): PlayerMovementIntent {
  const magnitude = Math.hypot(intent.horizontal, intent.forward)
  if (magnitude === 0) {
    return NEUTRAL_INTENT
  }
  if (magnitude <= 1) {
    return intent
  }
  return {
    horizontal: intent.horizontal / magnitude,
    forward: intent.forward / magnitude,
  }
}
