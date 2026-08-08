import { describe, expect, it } from 'vitest'
import { BrowserAttackInput } from './browserAttackInput'

function dispatchMouseEvent(
  target: EventTarget,
  type: 'mousedown' | 'mouseup',
  button = 0,
  shiftKey = false,
): void {
  const event = new Event(type, { cancelable: true })
  Object.defineProperties(event, {
    button: { value: button },
    shiftKey: { value: shiftKey },
  })
  target.dispatchEvent(event)
}

function createInput(visibilityState = 'visible') {
  const windowTarget = new EventTarget()
  const documentTarget = new EventTarget()
  Object.defineProperty(documentTarget, 'visibilityState', {
    configurable: true,
    value: visibilityState,
  })
  const input = new BrowserAttackInput(
    windowTarget as unknown as Window,
    documentTarget as unknown as Document,
  )
  input.connect()
  return { input, windowTarget, documentTarget }
}

describe('BrowserAttackInput', () => {
  it('emits exactly one light request for a held primary button', () => {
    const { input, windowTarget } = createInput()

    dispatchMouseEvent(windowTarget, 'mousedown')
    expect(input.consumeAttackRequest()).toEqual({
      type: 'player-attack',
      attack: 'light',
    })
    expect(input.consumeAttackRequest()).toBeNull()

    dispatchMouseEvent(windowTarget, 'mousedown')
    expect(input.consumeAttackRequest()).toBeNull()
  })

  it('maps shift plus primary button to heavy instead of light', () => {
    const { input, windowTarget } = createInput()

    dispatchMouseEvent(windowTarget, 'mousedown', 0, true)

    expect(input.consumeAttackRequest()).toEqual({
      type: 'player-attack',
      attack: 'heavy',
    })
  })

  it('allows a new edge after release', () => {
    const { input, windowTarget } = createInput()

    dispatchMouseEvent(windowTarget, 'mousedown')
    input.consumeAttackRequest()
    dispatchMouseEvent(windowTarget, 'mouseup')
    dispatchMouseEvent(windowTarget, 'mousedown')

    expect(input.consumeAttackRequest()?.attack).toBe('light')
  })

  it('clears pending and held state on focus loss, hidden tab, and reset', () => {
    const { input, windowTarget, documentTarget } = createInput()

    dispatchMouseEvent(windowTarget, 'mousedown')
    windowTarget.dispatchEvent(new Event('blur'))
    expect(input.consumeAttackRequest()).toBeNull()

    dispatchMouseEvent(windowTarget, 'mousedown')
    Object.defineProperty(documentTarget, 'visibilityState', { value: 'hidden' })
    documentTarget.dispatchEvent(new Event('visibilitychange'))
    expect(input.consumeAttackRequest()).toBeNull()

    Object.defineProperty(documentTarget, 'visibilityState', { value: 'visible' })
    dispatchMouseEvent(windowTarget, 'mousedown')
    input.reset()
    expect(input.consumeAttackRequest()).toBeNull()
  })
})
