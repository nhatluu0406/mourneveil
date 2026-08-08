export interface PlayerMovementIntent {
  readonly horizontal: number
  readonly forward: number
}

export interface MovementInputState {
  readonly left: boolean
  readonly right: boolean
  readonly forward: boolean
  readonly backward: boolean
}

export type MovementDirection = keyof MovementInputState

const NEUTRAL_MOVEMENT_INPUT_STATE: MovementInputState = Object.freeze({
  left: false,
  right: false,
  forward: false,
  backward: false,
})

export function createMovementInputState(): MovementInputState {
  return NEUTRAL_MOVEMENT_INPUT_STATE
}

export function setMovementDirection(
  state: MovementInputState,
  direction: MovementDirection,
  held: boolean,
): MovementInputState {
  if (state[direction] === held) {
    return state
  }

  return { ...state, [direction]: held }
}

export function resetMovementInputState(
  state: MovementInputState,
): MovementInputState {
  return state === NEUTRAL_MOVEMENT_INPUT_STATE
    ? state
    : NEUTRAL_MOVEMENT_INPUT_STATE
}

export function toPlayerMovementIntent(
  state: MovementInputState,
): PlayerMovementIntent {
  const horizontal = Number(state.right) - Number(state.left)
  const forward = Number(state.forward) - Number(state.backward)
  const magnitude = Math.hypot(horizontal, forward)

  if (magnitude === 0) {
    return { horizontal: 0, forward: 0 }
  }

  const normalizationScale = magnitude > 1 ? 1 / magnitude : 1
  return {
    horizontal: horizontal * normalizationScale,
    forward: forward * normalizationScale,
  }
}
