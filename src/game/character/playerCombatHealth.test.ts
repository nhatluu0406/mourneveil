import { describe, expect, it } from 'vitest'
import { PlayerCombatHealthRuntime } from './playerCombatHealth'

describe('minimal M3 player combat health', () => {
  it('has stable identity, clamps defeat at zero, rejects dead-state damage, and resets', () => {
    const player = new PlayerCombatHealthRuntime({ x: 1, y: 0.82, z: 2 })
    expect(player.snapshot()).toMatchObject({
      id: 'player',
      defeated: false,
      health: { maximum: 100, current: 100, alive: true },
      hurtbox: { id: 'player.hurtbox', ownerId: 'player' },
    })

    expect(player.applyDamage(120)).toMatchObject({ applied: true, appliedDamage: 100 })
    expect(player.snapshot()).toMatchObject({ defeated: true, health: { current: 0 } })
    expect(player.applyDamage(1)).toMatchObject({ applied: false, appliedDamage: 0 })
    player.reset()
    expect(player.snapshot().health).toEqual({ maximum: 100, current: 100, alive: true })
  })

  it('moves the stable hurtbox with authoritative player position', () => {
    const player = new PlayerCombatHealthRuntime({ x: 0, y: 0.82, z: 0 })
    player.updatePosition({ x: 2, y: 0.82, z: -1 })
    expect(player.snapshot().hurtbox).toMatchObject({
      id: 'player.hurtbox',
      center: { x: 2, y: 0.82, z: -1 },
    })
  })
})
