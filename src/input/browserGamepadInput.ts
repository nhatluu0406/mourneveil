import {
  isNeutralMovementIntent,
  leftStickAxesToMovementIntent,
} from './gamepadMovementIntent'
import type { PlayerMovementIntent } from './playerMovementIntent'

const NEUTRAL_INTENT: PlayerMovementIntent = Object.freeze({
  horizontal: 0,
  forward: 0,
})

export interface GamepadLike {
  readonly connected: boolean
  readonly axes: ReadonlyArray<number>
}

export interface GamepadSnapshotReader {
  getGamepads(): ReadonlyArray<GamepadLike | null>
}

const defaultReader: GamepadSnapshotReader = {
  getGamepads: () =>
    typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function'
      ? []
      : navigator.getGamepads(),
}

/**
 * Polls the browser Gamepad API into semantic movement intent.
 * Polling belongs at the input/app boundary — never in game-core.
 */
export class BrowserGamepadInput {
  private connected = false
  private suppressUntilNeutral = false

  constructor(
    private readonly browserWindow: Window,
    private readonly browserDocument: Document,
    private readonly reader: GamepadSnapshotReader = defaultReader,
  ) {}

  connect(): void {
    if (this.connected) {
      return
    }

    this.browserWindow.addEventListener('gamepadconnected', this.handleConnectionChange)
    this.browserWindow.addEventListener(
      'gamepaddisconnected',
      this.handleConnectionChange,
    )
    this.browserWindow.addEventListener('blur', this.handleFocusLoss)
    this.browserDocument.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    )
    this.connected = true
  }

  disconnect(): void {
    if (!this.connected) {
      return
    }

    this.browserWindow.removeEventListener(
      'gamepadconnected',
      this.handleConnectionChange,
    )
    this.browserWindow.removeEventListener(
      'gamepaddisconnected',
      this.handleConnectionChange,
    )
    this.browserWindow.removeEventListener('blur', this.handleFocusLoss)
    this.browserDocument.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    )
    this.connected = false
    this.reset()
  }

  /** Sample currently connected pads. Call once per animation frame from the app loop. */
  movementIntent(): PlayerMovementIntent {
    if (!this.connected) {
      return NEUTRAL_INTENT
    }

    const sampled = this.samplePrimaryPadIntent()
    if (this.suppressUntilNeutral) {
      if (isNeutralMovementIntent(sampled)) {
        this.suppressUntilNeutral = false
        return sampled
      }
      return NEUTRAL_INTENT
    }

    return sampled
  }

  reset(): void {
    this.suppressUntilNeutral = true
  }

  private samplePrimaryPadIntent(): PlayerMovementIntent {
    const pads = this.reader.getGamepads()
    const pad = pads.find((entry) => entry !== null && entry.connected)
    if (pad === undefined || pad === null) {
      return NEUTRAL_INTENT
    }

    return leftStickAxesToMovementIntent(pad.axes[0] ?? 0, pad.axes[1] ?? 0)
  }

  private readonly handleConnectionChange = (): void => {
    // Disconnect clears stale steer; connect resumes from the next poll sample.
    if (!this.reader.getGamepads().some((entry) => entry?.connected)) {
      this.reset()
    }
  }

  private readonly handleFocusLoss = (): void => {
    this.reset()
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.browserDocument.visibilityState === 'hidden') {
      this.reset()
    }
  }
}
