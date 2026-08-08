import { describe, expect, it } from 'vitest'
import { BrowserMovementInput } from './browserMovementInput'

function dispatchKeyboardEvent(
  target: EventTarget,
  type: 'keydown' | 'keyup',
  code: string,
): void {
  const event = new Event(type, { cancelable: true })
  Object.defineProperty(event, 'code', { value: code })
  target.dispatchEvent(event)
}

describe('BrowserMovementInput', () => {
  it('maps browser keys while preserving another held binding', () => {
    const windowTarget = new EventTarget()
    const documentTarget = new EventTarget()
    const input = new BrowserMovementInput(
      windowTarget as unknown as Window,
      documentTarget as unknown as Document,
    )
    input.connect()

    dispatchKeyboardEvent(windowTarget, 'keydown', 'KeyW')
    dispatchKeyboardEvent(windowTarget, 'keydown', 'ArrowUp')
    dispatchKeyboardEvent(windowTarget, 'keyup', 'KeyW')

    expect(input.movementIntent()).toEqual({ horizontal: 0, forward: 1 })
  })

  it('clears held input on focus loss and listener cleanup', () => {
    const windowTarget = new EventTarget()
    const documentTarget = new EventTarget()
    const input = new BrowserMovementInput(
      windowTarget as unknown as Window,
      documentTarget as unknown as Document,
    )
    input.connect()

    dispatchKeyboardEvent(windowTarget, 'keydown', 'KeyD')
    windowTarget.dispatchEvent(new Event('blur'))
    expect(input.movementIntent()).toEqual({ horizontal: 0, forward: 0 })

    input.disconnect()
    dispatchKeyboardEvent(windowTarget, 'keydown', 'KeyW')
    expect(input.movementIntent()).toEqual({ horizontal: 0, forward: 0 })
  })
})
