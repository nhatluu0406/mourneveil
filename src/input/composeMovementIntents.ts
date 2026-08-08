import type { PlayerMovementIntent } from './playerMovementIntent'
import {
  isNeutralMovementIntent,
  normalizeMovementIntent,
} from './gamepadMovementIntent'

/**
 * Active semantic input source for diagnostics.
 *
 * Composition policy: sum keyboard + gamepad intents, then clamp magnitude to ≤ 1.
 * A single active source therefore behaves identically to that source alone.
 */
export type ActiveMovementInputSource =
  | 'none'
  | 'keyboard'
  | 'gamepad'
  | 'combined'

export interface ComposedMovementInput {
  readonly intent: PlayerMovementIntent
  readonly source: ActiveMovementInputSource
}

export function composeMovementIntents(
  keyboard: PlayerMovementIntent,
  gamepad: PlayerMovementIntent,
): ComposedMovementInput {
  const intent = normalizeMovementIntent({
    horizontal: keyboard.horizontal + gamepad.horizontal,
    forward: keyboard.forward + gamepad.forward,
  })
  const keyboardActive = !isNeutralMovementIntent(keyboard)
  const gamepadActive = !isNeutralMovementIntent(gamepad)

  let source: ActiveMovementInputSource = 'none'
  if (keyboardActive && gamepadActive) {
    source = 'combined'
  } else if (keyboardActive) {
    source = 'keyboard'
  } else if (gamepadActive) {
    source = 'gamepad'
  }

  return { intent, source }
}
