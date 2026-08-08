import { describe, expect, it } from 'vitest'
import {
  BrowserGamepadInput,
  type GamepadLike,
  type GamepadSnapshotReader,
} from './browserGamepadInput'

class FakePadReader implements GamepadSnapshotReader {
  pads: Array<GamepadLike | null> = []

  getGamepads(): ReadonlyArray<GamepadLike | null> {
    return this.pads
  }
}

describe('BrowserGamepadInput', () => {
  it('returns neutral when no pad is connected', () => {
    const windowTarget = new EventTarget()
    const documentTarget = Object.assign(new EventTarget(), {
      visibilityState: 'visible',
    })
    const reader = new FakePadReader()
    const input = new BrowserGamepadInput(
      windowTarget as unknown as Window,
      documentTarget as unknown as Document,
      reader,
    )
    input.connect()

    expect(input.movementIntent()).toEqual({ horizontal: 0, forward: 0 })
  })

  it('maps a connected left stick and clears after disconnect/reset', () => {
    const windowTarget = new EventTarget()
    const documentTarget = Object.assign(new EventTarget(), {
      visibilityState: 'visible',
    })
    const reader = new FakePadReader()
    const input = new BrowserGamepadInput(
      windowTarget as unknown as Window,
      documentTarget as unknown as Document,
      reader,
    )
    input.connect()

    reader.pads = [{ connected: true, axes: [1, 0] }]
    expect(input.movementIntent()).toEqual({ horizontal: 1, forward: 0 })

    reader.pads = []
    windowTarget.dispatchEvent(new Event('gamepaddisconnected'))
    expect(input.movementIntent()).toEqual({ horizontal: 0, forward: 0 })

    reader.pads = [{ connected: true, axes: [0, -1] }]
    // Reset/suppress holds neutral until the stick recenters.
    input.reset()
    expect(input.movementIntent()).toEqual({ horizontal: 0, forward: 0 })
    reader.pads = [{ connected: true, axes: [0, 0] }]
    expect(input.movementIntent()).toEqual({ horizontal: 0, forward: 0 })
    reader.pads = [{ connected: true, axes: [0, -1] }]
    expect(input.movementIntent().forward).toBeCloseTo(1)
  })

  it('resets on focus loss while a stick is deflected', () => {
    const windowTarget = new EventTarget()
    const documentTarget = Object.assign(new EventTarget(), {
      visibilityState: 'visible',
    })
    const reader = new FakePadReader()
    const input = new BrowserGamepadInput(
      windowTarget as unknown as Window,
      documentTarget as unknown as Document,
      reader,
    )
    input.connect()
    reader.pads = [{ connected: true, axes: [1, 0] }]
    expect(input.movementIntent().horizontal).toBe(1)

    windowTarget.dispatchEvent(new Event('blur'))
    expect(input.movementIntent()).toEqual({ horizontal: 0, forward: 0 })
  })
})
