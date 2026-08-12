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

  it('does not starve a distance-valid attack across even-duration cycles', () => {
    let previousAttackId: ReturnType<typeof selectBossAttack>['actionId'] | null = null
    const selected = []
    for (const simulationStep of [0, 60, 156, 228, 324, 396]) {
      const next = selectBossAttack({
        healthCurrent: 200,
        healthMaximum: 200,
        playerDistance: 1.75,
        previousAttackId,
        simulationStep,
      })
      selected.push(next.kind)
      previousAttackId = next.actionId
    }
    expect(new Set(selected)).toEqual(new Set(['slash', 'crush', 'lunge']))
  })

  it('reaches every phase-1 kit attack via successor cycling alone', () => {
    // Mid-range pool is alphabetically crush → lunge → slash. Successor ignores render timing.
    let previousAttackId: ReturnType<typeof selectBossAttack>['actionId'] | null = null
    const selected = new Set<string>()
    for (let cycle = 0; cycle < 3; cycle += 1) {
      const next = selectBossAttack({
        healthCurrent: 420,
        healthMaximum: 420,
        playerDistance: 1.75,
        previousAttackId,
        simulationStep: 999, // must not matter once a prior attack exists
      })
      selected.add(next.kind)
      previousAttackId = next.actionId
    }
    expect(selected).toEqual(new Set(['crush', 'lunge', 'slash']))
  })

  it('reaches every phase-2 kit attack including slam via successor cycling', () => {
    let previousAttackId: ReturnType<typeof selectBossAttack>['actionId'] | null = null
    const selected = new Set<string>()
    for (let cycle = 0; cycle < 4; cycle += 1) {
      const next = selectBossAttack({
        healthCurrent: 100,
        healthMaximum: 420,
        playerDistance: 1.7,
        previousAttackId,
        simulationStep: 0,
      })
      selected.add(next.kind)
      previousAttackId = next.actionId
    }
    expect(selected).toEqual(new Set(['crush', 'lunge', 'slash', 'slam']))
  })

  it('keeps selection independent of render-frame timing', () => {
    const base = {
      healthCurrent: 420,
      healthMaximum: 420,
      playerDistance: 1.75,
      previousAttackId: BOSS_SLASH.id,
    }
    expect(selectBossAttack({ ...base, simulationStep: 0 })).toEqual(
      selectBossAttack({ ...base, simulationStep: 1_000_001 }),
    )
  })
})
