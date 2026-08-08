import {
  createPlayerAttackRequest,
  type PlayerAttackRequest,
} from './playerAttackIntent'

const PRIMARY_MOUSE_BUTTON = 0

export class BrowserAttackInput {
  private primaryButtonHeld = false
  private pendingRequest: PlayerAttackRequest | null = null
  private connected = false

  constructor(
    private readonly browserWindow: Window,
    private readonly browserDocument: Document,
  ) {}

  connect(): void {
    if (this.connected) {
      return
    }

    this.browserWindow.addEventListener('mousedown', this.handleMouseDown)
    this.browserWindow.addEventListener('mouseup', this.handleMouseUp)
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

    this.browserWindow.removeEventListener('mousedown', this.handleMouseDown)
    this.browserWindow.removeEventListener('mouseup', this.handleMouseUp)
    this.browserWindow.removeEventListener('blur', this.handleFocusLoss)
    this.browserDocument.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    )
    this.connected = false
    this.reset()
  }

  consumeAttackRequest(): PlayerAttackRequest | null {
    const request = this.pendingRequest
    this.pendingRequest = null
    return request
  }

  reset(): void {
    this.primaryButtonHeld = false
    this.pendingRequest = null
  }

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (event.button !== PRIMARY_MOUSE_BUTTON || this.primaryButtonHeld) {
      return
    }

    event.preventDefault()
    this.primaryButtonHeld = true
    if (this.pendingRequest === null) {
      this.pendingRequest = createPlayerAttackRequest(
        event.shiftKey ? 'heavy' : 'light',
      )
    }
  }

  private readonly handleMouseUp = (event: MouseEvent): void => {
    if (event.button === PRIMARY_MOUSE_BUTTON) {
      this.primaryButtonHeld = false
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
