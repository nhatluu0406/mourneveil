import { describe, expect, it } from 'vitest'
import { resolvePlayerSkillPresentation } from './playerSkillPresentation'

describe('player skill presentation', () => {
  it.each([
    ['skill.veil-step', 'veil-fracture'],
    ['skill.oath-cleave', 'oath-arc'],
    ['skill.ward-pulse', 'ward-facets'],
  ] as const)('maps %s to a distinct authored motif', (actionId, motif) => {
    expect(resolvePlayerSkillPresentation({ actionId, phase: 'active', normalizedPhaseProgress: 0.5 })).toMatchObject({
      visible: true,
      motif,
      intensity: 1,
    })
  })

  it('derives intensity only from the authoritative phase progress', () => {
    expect(resolvePlayerSkillPresentation({ actionId: 'skill.oath-cleave', phase: 'startup', normalizedPhaseProgress: 0.4 }).intensity).toBeCloseTo(0.55)
    expect(resolvePlayerSkillPresentation({ actionId: 'skill.oath-cleave', phase: 'recovery', normalizedPhaseProgress: 0.5 }).intensity).toBeCloseTo(0.59)
  })

  it('stays hidden for idle and ordinary combat actions', () => {
    expect(resolvePlayerSkillPresentation({ actionId: null, phase: 'idle', normalizedPhaseProgress: 0 })).toMatchObject({ visible: false, motif: null })
    expect(resolvePlayerSkillPresentation({ actionId: 'player.attack.heavy', phase: 'active', normalizedPhaseProgress: 0.5 })).toMatchObject({ visible: false, motif: null })
  })
})
