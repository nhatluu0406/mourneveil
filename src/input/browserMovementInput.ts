import {
  createMovementInputState,
  resetMovementInputState,
  setMovementDirection,
  toPlayerMovementIntent,
  type MovementDirection,
  type MovementInputState,
  type PlayerMovementIntent,
} from './playerMovementIntent'

const MOVEMENT_DIRECTION_BY_CODE: Readonly<Record<string, MovementDirection>> = {
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
}

export class BrowserMovementInput {
  private state: MovementInputState = createMovementInputState()
  private readonly heldCodes = new Set<string>()
  private connected = false

  constructor(
    private readonly browserWindow: Window,
    private readonly browserDocument: Document,
  ) {}

  connect(): void {
    if (this.connected) {
      return
    }

    this.browserWindow.addEventListener('keydown', this.handleKeyDown)
    this.browserWindow.addEventListener('keyup', this.handleKeyUp)
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

    this.browserWindow.removeEventListener('keydown', this.handleKeyDown)
    this.browserWindow.removeEventListener('keyup', this.handleKeyUp)
    this.browserWindow.removeEventListener('blur', this.handleFocusLoss)
    this.browserDocument.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    )
    this.connected = false
    this.reset()
  }

  movementIntent(): PlayerMovementIntent {
    return toPlayerMovementIntent(this.state)
  }

  reset(): void {
    this.heldCodes.clear()
    this.state = resetMovementInputState(this.state)
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.updateFromKeyboardEvent(event, true)
  }

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.updateFromKeyboardEvent(event, false)
  }

  private readonly handleFocusLoss = (): void => {
    this.reset()
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.browserDocument.visibilityState === 'hidden') {
      this.reset()
    }
  }

  private updateFromKeyboardEvent(event: KeyboardEvent, held: boolean): void {
    const direction = MOVEMENT_DIRECTION_BY_CODE[event.code]
    if (direction === undefined) {
      return
    }

    event.preventDefault()
    if (held) {
      this.heldCodes.add(event.code)
    } else {
      this.heldCodes.delete(event.code)
    }

    let nextState = resetMovementInputState(this.state)
    for (const heldCode of this.heldCodes) {
      const heldDirection = MOVEMENT_DIRECTION_BY_CODE[heldCode]
      if (heldDirection !== undefined) {
        nextState = setMovementDirection(nextState, heldDirection, true)
      }
    }
    this.state = nextState
  }
}
