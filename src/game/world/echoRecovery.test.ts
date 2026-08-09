import { describe, expect, it } from 'vitest'
import { EchoRecoveryRuntime } from './echoRecovery'

describe('EchoRecoveryRuntime', () => {
  it('creates one active recovery and restores once', () => {
    const recovery = new EchoRecoveryRuntime()
    recovery.dropAt({ x: 1, y: 0.82, z: 2 }, 85)
    expect(recovery.snapshot()).toEqual({
      id: 'world.echo-recovery',
      active: true,
      amount: 85,
      position: { x: 1, y: 0.82, z: 2 },
    })
    expect(
      recovery.tryPickup({ x: 1.2, y: 0.82, z: 2.1 }, true),
    ).toEqual({ accepted: true, amount: 85 })
    expect(recovery.snapshot().active).toBe(false)
    expect(
      recovery.tryPickup({ x: 1.2, y: 0.82, z: 2.1 }, true),
    ).toEqual({ accepted: false, reason: 'inactive' })
  })

  it('rejects out-of-range and dead pickup; zero drop clears prior', () => {
    const recovery = new EchoRecoveryRuntime()
    recovery.dropAt({ x: 0, y: 0.82, z: 0 }, 40)
    expect(
      recovery.tryPickup({ x: 3, y: 0.82, z: 0 }, true),
    ).toEqual({ accepted: false, reason: 'out-of-range' })
    expect(
      recovery.tryPickup({ x: 0, y: 0.82, z: 0 }, false),
    ).toEqual({ accepted: false, reason: 'actor-dead' })
    recovery.dropAt({ x: 2, y: 0.82, z: 2 }, 0)
    expect(recovery.snapshot().active).toBe(false)
  })

  it('second drop replaces prior recovery', () => {
    const recovery = new EchoRecoveryRuntime()
    recovery.dropAt({ x: 1, y: 0.82, z: 1 }, 50)
    recovery.dropAt({ x: 4, y: 0.82, z: 4 }, 10)
    expect(recovery.snapshot()).toMatchObject({
      active: true,
      amount: 10,
      position: { x: 4, y: 0.82, z: 4 },
    })
  })
})
