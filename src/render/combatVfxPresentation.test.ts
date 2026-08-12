import { describe, expect, it } from 'vitest'
import type { CombatHitEvent } from '../game/combat/combatContact'
import { resolveCombatVfxPresentation } from './combatVfxPresentation'

function event(overrides: Partial<CombatHitEvent> = {}): CombatHitEvent {
  return {
    type: 'combat-hit',
    attackerId: 'player',
    targetId: 'enemy.skirmisher.introduction',
    actionId: 'player.attack.heavy',
    executionId: 1,
    contactWindowId: 'player.attack.heavy.contact',
    contactPosition: { x: 1, y: 0.8, z: 2 },
    simulationStep: 10,
    damage: 20,
    appliedDamage: 20,
    outcome: 'damaged',
    ...overrides,
  }
}

describe('combat VFX projection', () => {
  it('projects a heavy hit without mutating the authoritative event', () => {
    const hit = event()
    const before = structuredClone(hit)
    expect(resolveCombatVfxPresentation(hit, 15)).toMatchObject({
      kind: 'heavy-hit',
      visible: true,
    })
    expect(hit).toEqual(before)
  })

  it('distinguishes guard and guard break and expires deterministically', () => {
    expect(resolveCombatVfxPresentation(event({ outcome: 'guarded' }), 10).kind).toBe('guard')
    expect(resolveCombatVfxPresentation(event({ outcome: 'guard-broken' }), 10).kind).toBe('guard-break')
    expect(resolveCombatVfxPresentation(event(), 32).visible).toBe(false)
  })
})
