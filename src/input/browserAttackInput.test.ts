import { describe, expect, it, vi } from 'vitest'
import { BrowserAttackInput } from './browserAttackInput'

function dispatchEventWithProperties(
  target: EventTarget,
  type: string,
  properties: Record<string, unknown> = {},
): Event {
  const event = new Event(type, { cancelable: true })
  Object.defineProperties(
    event,
    Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [key, { value }]),
    ),
  )
  target.dispatchEvent(event)
  return event
}

function createInput() {
  const surface = new EventTarget() as HTMLElement
  Object.assign(surface, {
    setPointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => true),
    releasePointerCapture: vi.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100 }),
  })
  const windowTarget = new EventTarget()
  const documentTarget = new EventTarget()
  Object.defineProperty(documentTarget, 'visibilityState', {
    configurable: true,
    value: 'visible',
  })
  const surfaceExit = vi.fn()
  const input = new BrowserAttackInput(
    surface,
    windowTarget as unknown as Window,
    documentTarget as unknown as Document,
    () => ({ x: 1, z: 0 }),
    surfaceExit,
  )
  input.connect()
  return { input, surface, windowTarget, documentTarget, surfaceExit }
}

describe('BrowserAttackInput', () => {
  it('emits one aimed light edge from the gameplay surface only', () => {
    const { input, surface } = createInput()
    const uiButton = new EventTarget()

    dispatchEventWithProperties(uiButton, 'pointerdown', { button: 0, pointerId: 1 })
    expect(input.consumeAttackRequest()).toBeNull()

    dispatchEventWithProperties(surface, 'pointerdown', {
      button: 0,
      pointerId: 2,
      clientX: 50,
      clientY: 60,
      shiftKey: false,
    })
    expect(input.consumeAttackRequest()).toEqual({
      type: 'player-attack',
      attack: 'light',
      aimDirection: { x: 1, z: 0 },
    })
    dispatchEventWithProperties(surface, 'pointerdown', { button: 0, pointerId: 2 })
    expect(input.consumeAttackRequest()).toBeNull()
  })

  it('maps shift plus LMB to heavy and permits another edge after pointerup', () => {
    const { input, surface } = createInput()
    dispatchEventWithProperties(surface, 'pointerdown', {
      button: 0,
      pointerId: 1,
      shiftKey: true,
    })
    expect(input.consumeAttackRequest()?.attack).toBe('heavy')
    dispatchEventWithProperties(surface, 'pointerup', {
      button: 0,
      pointerId: 1,
      clientX: 50,
      clientY: 50,
    })
    dispatchEventWithProperties(surface, 'pointerdown', { button: 0, pointerId: 2 })
    expect(input.consumeAttackRequest()?.attack).toBe('light')
  })

  it('maps Space to one dodge edge while held', () => {
    const { input, windowTarget } = createInput()
    dispatchEventWithProperties(windowTarget, 'keydown', { code: 'Space' })
    expect(input.consumeDodgeRequest()).toEqual({ type: 'player-dodge' })
    dispatchEventWithProperties(windowTarget, 'keydown', { code: 'Space' })
    expect(input.consumeDodgeRequest()).toBeNull()
    dispatchEventWithProperties(windowTarget, 'keyup', { code: 'Space' })
    dispatchEventWithProperties(windowTarget, 'keydown', { code: 'Space' })
    expect(input.consumeDodgeRequest()).toEqual({ type: 'player-dodge' })
  })

  it('maps E, F, and R to semantic flask, checkpoint, and respawn edges', () => {
    const { input, windowTarget } = createInput()
    dispatchEventWithProperties(windowTarget, 'keydown', { code: 'KeyE' })
    dispatchEventWithProperties(windowTarget, 'keydown', { code: 'KeyF' })
    dispatchEventWithProperties(windowTarget, 'keydown', { code: 'KeyR' })
    expect(input.consumeFlaskUseRequest()).toEqual({ type: 'player-flask-use' })
    expect(input.consumeCheckpointInteractionRequest()).toEqual({
      type: 'player-checkpoint-interaction',
    })
    expect(input.consumeRespawnRequest()).toEqual({ type: 'player-respawn' })
    dispatchEventWithProperties(windowTarget, 'keydown', { code: 'KeyE' })
    dispatchEventWithProperties(windowTarget, 'keydown', { code: 'KeyF' })
    dispatchEventWithProperties(windowTarget, 'keydown', { code: 'KeyR' })
    expect(input.consumeFlaskUseRequest()).toBeNull()
    expect(input.consumeCheckpointInteractionRequest()).toBeNull()
    expect(input.consumeRespawnRequest()).toBeNull()
  })

  it('holds RMB guard, suppresses surface context menu, and releases cleanly', () => {
    const { input, surface } = createInput()
    dispatchEventWithProperties(surface, 'pointerdown', { button: 2, pointerId: 4 })
    expect(input.guardHeld()).toBe(true)
    const menuEvent = dispatchEventWithProperties(surface, 'contextmenu')
    expect(menuEvent.defaultPrevented).toBe(true)
    dispatchEventWithProperties(surface, 'pointerup', {
      button: 2,
      pointerId: 4,
      clientX: 50,
      clientY: 50,
    })
    expect(input.guardHeld()).toBe(false)
    expect(input.consumeAttackRequest()).toBeNull()
  })

  it('clears held and pending state on cancel, surface exit, blur, and hidden tab', () => {
    const { input, surface, windowTarget, documentTarget, surfaceExit } = createInput()
    dispatchEventWithProperties(surface, 'pointerdown', { button: 2, pointerId: 1 })
    dispatchEventWithProperties(windowTarget, 'keydown', { code: 'Space' })
    dispatchEventWithProperties(surface, 'pointercancel')
    expect(input.snapshot()).toEqual({
      primaryButtonHeld: false,
      guardHeld: false,
      dodgeKeyHeld: false,
      checkpointKeyHeld: false,
      respawnKeyHeld: false,
      flaskKeyHeld: false,
      pendingAttack: false,
      pendingDodge: false,
      pendingCheckpointInteraction: false,
      pendingRespawn: false,
      pendingFlaskUse: false,
    })

    dispatchEventWithProperties(surface, 'pointerleave', { buttons: 0 })
    windowTarget.dispatchEvent(new Event('blur'))
    Object.defineProperty(documentTarget, 'visibilityState', { value: 'hidden' })
    documentTarget.dispatchEvent(new Event('visibilitychange'))
    expect(surfaceExit).toHaveBeenCalledTimes(4)
  })
})
