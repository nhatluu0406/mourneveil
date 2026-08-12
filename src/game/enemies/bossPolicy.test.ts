import { describe, expect, it } from 'vitest'
import {
  BOSS_ATTACK_KIT,
  BOSS_PHASE_TWO_HEALTH_RATIO,
  BOSS_SLASH,
  BOSS_SLAM,
  resolveBossPhase,
} from './bossKit'
import { selectBossAttack } from './bossPolicy'

describe('bossKit', () => {
  it('resolves phase from HP threshold', () => {
    expect(resolveBossPhase(100, 100)).toBe(1)
    expect(resolveBossPhase(100 * BOSS_PHASE_TWO_HEALTH_RATIO, 100)).toBe(2)
    expect(resolveBossPhase(10, 100)).toBe(2)
  })

  it('authors four attacks with slam phase-2 only', () => {
    expect(BOSS_ATTACK_KIT).toHaveLength(4)
    const slam = BOSS_ATTACK_KIT.find((entry) => entry.kind === 'slam')
    expect(slam?.phases).toEqual([2])
  })
})

describe('bossPolicy', () => {
  it('selects deterministically for identical inputs', () => {
    const input = {
      healthCurrent: 200,
      healthMaximum: 200,
      playerDistance: 1.2,
      previousAttackId: null,
      simulationStep: 12,
    }
    expect(selectBossAttack(input)).toEqual(selectBossAttack(input))
  })

  it('avoids immediate repeat when alternatives exist', () => {
    const first = selectBossAttack({
      healthCurrent: 200,
      healthMaximum: 200,
      playerDistance: 1.2,
      previousAttackId: null,
      simulationStep: 0,
    })
    const second = selectBossAttack({
      healthCurrent: 200,
      healthMaximum: 200,
      playerDistance: 1.2,
      previousAttackId: first.actionId,
      simulationStep: 0,
    })
    expect(second.actionId).not.toBe(first.actionId)
  })

  it('unlocks slam only in phase 2 close range', () => {
    const phase1 = selectBossAttack({
      healthCurrent: 200,
      healthMaximum: 200,
      playerDistance: 1.0,
      previousAttackId: BOSS_SLASH.id,
      simulationStep: 3,
    })
    expect(phase1.phase).toBe(1)
    expect(phase1.actionId).not.toBe(BOSS_SLAM.id)

    const phase2 = selectBossAttack({
      healthCurrent: 80,
      healthMaximum: 200,
      playerDistance: 1.0,
      previousAttackId: BOSS_SLASH.id,
      simulationStep: 3,
    })
    expect(phase2.phase).toBe(2)
  })
})
