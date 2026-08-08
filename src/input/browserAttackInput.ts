import {
  createPlayerAttackRequest,
  type PlayerAttackRequest,
} from './playerAttackIntent'
import type { PlayerAimDirection } from './playerAimIntent'
import { PLAYER_DODGE_REQUEST, type PlayerDodgeRequest } from './playerDefenseIntent'

const PRIMARY_MOUSE_BUTTON = 0
const SECONDARY_MOUSE_BUTTON = 2
const DODGE_CODE = 'Space'

export type AimDirectionResolver = (
  clientX: number,
  clientY: number,
) => PlayerAimDirection | null

export interface CombatInputSnapshot {
  readonly primaryButtonHeld: boolean
  readonly guardHeld: boolean
  readonly dodgeKeyHeld: boolean
  readonly pendingAttack: boolean
  readonly pendingDodge: boolean
}

export class BrowserAttackInput {
  private primaryButtonHeld = false
  private guardHeldState = false
  private dodgeKeyHeld = false
  private pendingAttack: PlayerAttackRequest | null = null
  private pendingDodge: PlayerDodgeRequest | null = null
  private connected = false

  constructor(
    private readonly gameplaySurface: HTMLElement,
    private readonly browserWindow: Window,
    private readonly browserDocument: Document,
    private readonly resolveAimDirection: AimDirectionResolver,
    private readonly onGameplaySurfaceExit: () => void = () => undefined,
  ) {}

  connect(): void {
    if (this.connected) return
    this.gameplaySurface.addEventListener('pointerdown', this.handlePointerDown)
    this.gameplaySurface.addEventListener('pointerup', this.handlePointerUp)
    this.gameplaySurface.addEventListener('pointercancel', this.handlePointerCancel)
    this.gameplaySurface.addEventListener(
      'lostpointercapture',
      this.handleLostPointerCapture,
    )
    this.gameplaySurface.addEventListener('pointerleave', this.handlePointerLeave)
    this.gameplaySurface.addEventListener('contextmenu', this.handleContextMenu)
    this.browserWindow.addEventListener('keydown', this.handleKeyDown)
    this.browserWindow.addEventListener('keyup', this.handleKeyUp)
    this.browserWindow.addEventListener('blur', this.handleFocusLoss)
    this.browserWindow.addEventListener('pagehide', this.handleFocusLoss)
    this.browserDocument.addEventListener('visibilitychange', this.handleVisibilityChange)
    this.connected = true
  }

  disconnect(): void {
    if (!this.connected) return
    this.gameplaySurface.removeEventListener('pointerdown', this.handlePointerDown)
    this.gameplaySurface.removeEventListener('pointerup', this.handlePointerUp)
    this.gameplaySurface.removeEventListener('pointercancel', this.handlePointerCancel)
    this.gameplaySurface.removeEventListener(
      'lostpointercapture',
      this.handleLostPointerCapture,
    )
    this.gameplaySurface.removeEventListener('pointerleave', this.handlePointerLeave)
    this.gameplaySurface.removeEventListener('contextmenu', this.handleContextMenu)
    this.browserWindow.removeEventListener('keydown', this.handleKeyDown)
    this.browserWindow.removeEventListener('keyup', this.handleKeyUp)
    this.browserWindow.removeEventListener('blur', this.handleFocusLoss)
    this.browserWindow.removeEventListener('pagehide', this.handleFocusLoss)
    this.browserDocument.removeEventListener('visibilitychange', this.handleVisibilityChange)
    this.connected = false
    this.reset()
  }

  consumeAttackRequest(): PlayerAttackRequest | null {
    const request = this.pendingAttack
    this.pendingAttack = null
    return request
  }

  consumeDodgeRequest(): PlayerDodgeRequest | null {
    const request = this.pendingDodge
    this.pendingDodge = null
    return request
  }

  guardHeld(): boolean {
    return this.guardHeldState
  }

  snapshot(): CombatInputSnapshot {
    return {
      primaryButtonHeld: this.primaryButtonHeld,
      guardHeld: this.guardHeldState,
      dodgeKeyHeld: this.dodgeKeyHeld,
      pendingAttack: this.pendingAttack !== null,
      pendingDodge: this.pendingDodge !== null,
    }
  }

  reset(): void {
    this.primaryButtonHeld = false
    this.guardHeldState = false
    this.dodgeKeyHeld = false
    this.pendingAttack = null
    this.pendingDodge = null
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button === PRIMARY_MOUSE_BUTTON && !this.primaryButtonHeld) {
      const aimDirection = this.resolveAimDirection(event.clientX, event.clientY)
      if (aimDirection === null) return
      event.preventDefault()
      this.primaryButtonHeld = true
      this.capturePointer(event.pointerId)
      if (this.pendingAttack === null) {
        this.pendingAttack = createPlayerAttackRequest(
          event.shiftKey ? 'heavy' : 'light',
          aimDirection,
        )
      }
      return
    }

    if (event.button === SECONDARY_MOUSE_BUTTON) {
      event.preventDefault()
      this.guardHeldState = true
      this.capturePointer(event.pointerId)
    }
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.button === PRIMARY_MOUSE_BUTTON) this.primaryButtonHeld = false
    if (event.button === SECONDARY_MOUSE_BUTTON) this.guardHeldState = false
    this.releasePointer(event.pointerId)
    if (!isPointInside(this.gameplaySurface, event.clientX, event.clientY)) {
      this.reset()
      this.onGameplaySurfaceExit()
    }
  }

  private readonly handlePointerCancel = (): void => {
    this.reset()
    this.onGameplaySurfaceExit()
  }

  private readonly handleLostPointerCapture = (): void => {
    this.primaryButtonHeld = false
    this.guardHeldState = false
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.buttons !== 0) return
    this.reset()
    this.onGameplaySurfaceExit()
  }

  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault()
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== DODGE_CODE || this.dodgeKeyHeld || isInteractiveTarget(event.target)) return
    event.preventDefault()
    this.dodgeKeyHeld = true
    this.pendingDodge = PLAYER_DODGE_REQUEST
  }

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.code === DODGE_CODE) this.dodgeKeyHeld = false
  }

  private readonly handleFocusLoss = (): void => {
    this.reset()
    this.onGameplaySurfaceExit()
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.browserDocument.visibilityState === 'hidden') this.handleFocusLoss()
  }

  private capturePointer(pointerId: number): void {
    if (this.gameplaySurface.setPointerCapture) {
      this.gameplaySurface.setPointerCapture(pointerId)
    }
  }

  private releasePointer(pointerId: number): void {
    if (this.gameplaySurface.hasPointerCapture?.(pointerId)) {
      this.gameplaySurface.releasePointerCapture(pointerId)
    }
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return false
  return target.closest('button, input, select, textarea, a[href], [contenteditable="true"]') !== null
}

function isPointInside(surface: HTMLElement, clientX: number, clientY: number): boolean {
  const bounds = surface.getBoundingClientRect()
  return (
    clientX >= bounds.left &&
    clientX <= bounds.right &&
    clientY >= bounds.top &&
    clientY <= bounds.bottom
  )
}
