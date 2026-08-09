import { describe, expect, it, vi } from 'vitest'
import { GameRuntime } from '../game/runtime/GameRuntime'
import { FIXED_STEP_SECONDS } from '../game/core/fixedStepClock'
import { PLAYER_LIGHT_ATTACK } from '../game/combat/playerAttackActions'
import { BrowserAttackInput } from './browserAttackInput'
import { BrowserMovementInput } from './browserMovementInput'

function dispatch(target: EventTarget, type: string, properties: Record<string, unknown>) {
  const event = new Event(type, { cancelable: true })
  Object.defineProperties(event, Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [key, { value }]),
  ))
  target.dispatchEvent(event)
}

describe('combat input lifecycle at a world border', () => {
  it('clears a missed keyup on gameplay-surface exit so reverse movement resumes after attack', () => {
    const windowTarget = new EventTarget()
    const documentTarget = new EventTarget()
    Object.defineProperty(documentTarget, 'visibilityState', { value: 'visible' })
    const surface = new EventTarget() as HTMLElement
    Object.assign(surface, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
      releasePointerCapture: vi.fn(),
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100 }),
    })
    const movement = new BrowserMovementInput(
      windowTarget as unknown as Window,
      documentTarget as unknown as Document,
    )
    const combat = new BrowserAttackInput(
      surface,
      windowTarget as unknown as Window,
      documentTarget as unknown as Document,
      () => ({ x: 0, z: -1 }),
      () => movement.reset(),
    )
    movement.connect()
    combat.connect()

    const runtime = new GameRuntime()
    let lastRequested = { x: 0, y: 0, z: 0 }
    let lastCorrected = { x: 0, y: 0, z: 0 }
    runtime.attachCollisionResolver((position, desired) => {
      lastRequested = { ...desired }
      lastCorrected = {
        x: desired.x,
        y: 0,
        z: Math.max(0, position.z + desired.z) - position.z,
      }
      return { translation: lastCorrected, grounded: true }
    })
    dispatch(windowTarget, 'keydown', { code: 'KeyW' })
    for (let step = 0; step < 120; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, movement.movementIntent())
    }
    expect(runtime.snapshot().player.position.z).toBe(0)

    dispatch(surface, 'pointerdown', { button: 0, pointerId: 1, shiftKey: false })
    runtime.requestPlayerAttack(combat.consumeAttackRequest()!)
    dispatch(surface, 'pointerup', {
      button: 0,
      pointerId: 1,
      clientX: 50,
      clientY: 50,
    })
    dispatch(windowTarget, 'keydown', { code: 'KeyS' })
    expect(movement.movementIntent()).toEqual({ horizontal: 0, forward: 0 })

    const committedSteps =
      PLAYER_LIGHT_ATTACK.action.startupSteps +
      PLAYER_LIGHT_ATTACK.action.activeSteps +
      PLAYER_LIGHT_ATTACK.action.recoverySteps
    for (let step = 0; step <= committedSteps; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, movement.movementIntent())
    }

    expect(runtime.snapshot().combat.phase).toBe('idle')
    expect(runtime.snapshot().attack.movementConstrained).toBe(false)
    expect(runtime.snapshot().player.grounded).toBe(true)
    expect(runtime.snapshot().player.velocity.x).toBe(0)
    expect(runtime.snapshot().player.velocity.z).toBe(0)
    expect(lastRequested.x).toBe(0)
    expect(Math.abs(lastRequested.z)).toBe(0)
    expect(lastCorrected.x).toBe(0)
    expect(Math.abs(lastCorrected.z)).toBe(0)
    expect(movement.movementIntent()).toEqual({ horizontal: 0, forward: 0 })

    dispatch(surface, 'pointerleave', { buttons: 0 })
    dispatch(windowTarget, 'keydown', { code: 'KeyS' })
    runtime.advanceFrame(FIXED_STEP_SECONDS, movement.movementIntent())
    expect(movement.movementIntent()).toEqual({ horizontal: 0, forward: -1 })
    expect(runtime.snapshot().player.position.z).toBeGreaterThan(0)
  })
})
