import { describe, expect, it } from 'vitest'
import type { CombatHitEvent } from '../game/combat/combatContact'
import {
  PLAYER_HEAVY_ATTACK_ID,
  PLAYER_LIGHT_ATTACK_ID,
} from '../game/combat/playerAttackActions'
import {
  isDuplicateHitConfirm,
  resolvePlayerOutgoingHitConfirm,
} from './playerCombatFeedback'

function hit(
  overrides: Partial<CombatHitEvent> &
    Pick<CombatHitEvent, 'actionId' | 'executionId' | 'targetId' | 'simulationStep'>,
): CombatHitEvent {
  return {
    type: 'combat-hit',
    attackerId: 'player',
    contactWindowId: 'player.attack.light.contact',
    contactPosition: { x: 0, y: 0.82, z: 0 },
    damage: 20,
    appliedDamage: 20,
    outcome: 'damaged',
    ...overrides,
  }
}

describe('player outgoing hit confirmation', () => {
  it('D: miss / absent hit produces no confirmation', () => {
    expect(
      resolvePlayerOutgoingHitConfirm({
        lastHit: null,
        enemies: [],
        simulationStep: 10,
      }).kind,
    ).toBe('none')
  })

  it('E: valid light hit produces modest confirmation', () => {
    const confirm = resolvePlayerOutgoingHitConfirm({
      lastHit: hit({
        actionId: PLAYER_LIGHT_ATTACK_ID,
        executionId: 1,
        targetId: 'enemy.skirmisher.introduction',
        simulationStep: 20,
      }),
      enemies: [{ id: 'enemy.skirmisher.introduction', alive: true, state: 'pursue' }],
      simulationStep: 22,
    })
    expect(confirm.kind).toBe('light')
    expect(confirm.cameraImpulseScale).toBeGreaterThan(0)
    expect(confirm.cameraImpulseScale).toBeLessThan(1)
    expect(confirm.flashIntensity).toBeGreaterThan(0)
  })

  it('F: heavy interrupting hit is stronger than light', () => {
    const light = resolvePlayerOutgoingHitConfirm({
      lastHit: hit({
        actionId: PLAYER_LIGHT_ATTACK_ID,
        executionId: 1,
        targetId: 'enemy.a',
        simulationStep: 10,
      }),
      enemies: [{ id: 'enemy.a', alive: true, state: 'pursue' }],
      simulationStep: 11,
    })
    const interrupt = resolvePlayerOutgoingHitConfirm({
      lastHit: hit({
        actionId: PLAYER_HEAVY_ATTACK_ID,
        executionId: 2,
        targetId: 'enemy.a',
        simulationStep: 10,
        damage: 35,
        appliedDamage: 35,
        contactWindowId: 'player.attack.heavy.contact',
      }),
      enemies: [{ id: 'enemy.a', alive: true, state: 'hitReaction' }],
      simulationStep: 11,
    })
    expect(interrupt.kind).toBe('interrupt')
    expect(interrupt.cameraImpulseScale).toBeGreaterThan(light.cameraImpulseScale)
    expect(interrupt.flashIntensity).toBeGreaterThan(light.flashIntensity)
  })

  it('G: same execution confirmation key cannot duplicate', () => {
    const confirm = resolvePlayerOutgoingHitConfirm({
      lastHit: hit({
        actionId: PLAYER_LIGHT_ATTACK_ID,
        executionId: 7,
        targetId: 'enemy.a',
        simulationStep: 40,
      }),
      enemies: [{ id: 'enemy.a', alive: true, state: 'spacing' }],
      simulationStep: 41,
    })
    expect(isDuplicateHitConfirm(confirm.confirmKey, confirm)).toBe(true)
    expect(isDuplicateHitConfirm('other', confirm)).toBe(false)
  })

  it('M: defeated target yields strongest confirmation', () => {
    const defeat = resolvePlayerOutgoingHitConfirm({
      lastHit: hit({
        actionId: PLAYER_HEAVY_ATTACK_ID,
        executionId: 3,
        targetId: 'enemy.a',
        simulationStep: 50,
        damage: 35,
        appliedDamage: 35,
        contactWindowId: 'player.attack.heavy.contact',
      }),
      enemies: [{ id: 'enemy.a', alive: false, state: 'defeated' }],
      simulationStep: 51,
    })
    expect(defeat.kind).toBe('defeat')
    expect(defeat.cameraImpulseScale).toBeGreaterThan(1.3)
  })

  it('ages out stale hits', () => {
    expect(
      resolvePlayerOutgoingHitConfirm({
        lastHit: hit({
          actionId: PLAYER_LIGHT_ATTACK_ID,
          executionId: 1,
          targetId: 'enemy.a',
          simulationStep: 1,
        }),
        enemies: [{ id: 'enemy.a', alive: true, state: 'idle' }],
        simulationStep: 40,
      }).kind,
    ).toBe('none')
  })
})
