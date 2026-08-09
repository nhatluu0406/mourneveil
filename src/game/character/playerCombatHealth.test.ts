import { describe, expect, it } from 'vitest'
import { PlayerHealthRuntime } from './playerHealth'

describe('canonical player health', () => {
  it('owns stable identity, deterministic damage, death, rejected dead damage, and restoration', () => {
    const player = new PlayerHealthRuntime({ x: 1, y: 0.82, z: 2 })
    expect(player.snapshot()).toMatchObject({
      id: 'player',
      lifeState: 'alive',
      health: { maximum: 100, current: 100, alive: true },
      hurtbox: { id: 'player.hurtbox', ownerId: 'player' },
    })

    expect(player.applyDamage(120)).toMatchObject({ applied: true, appliedDamage: 100 })
    expect(player.snapshot()).toMatchObject({ lifeState: 'dead', health: { current: 0 } })
    expect(player.applyDamage(1)).toMatchObject({ applied: false, appliedDamage: 0 })
    expect(player.restore(25)).toMatchObject({ applied: false, restoredHealth: 0 })
    player.restoreToMaximum()
    expect(player.snapshot().health).toEqual({ maximum: 100, current: 100, alive: true })
  })

  it('moves the stable hurtbox with authoritative player position', () => {
    const player = new PlayerHealthRuntime({ x: 0, y: 0.82, z: 0 })
    player.updatePosition({ x: 2, y: 0.82, z: -1 })
    expect(player.snapshot().hurtbox).toMatchObject({
      id: 'player.hurtbox',
      center: { x: 2, y: 0.82, z: -1 },
    })
  })
})
