import { describe, expect, it } from 'vitest'
import type { AnimationPresentationState } from './animationPresentation'
import { resolvePlayerProceduralPose } from './playerProceduralPose'

function state(
  mode: AnimationPresentationState['mode'],
  phase: 'startup' | 'active' | 'recovery' = 'startup',
  progress = 0.5,
): AnimationPresentationState {
  const committed = ['light-attack', 'heavy-attack', 'dodge', 'heal'].includes(mode)
  return {
    actorId: 'player',
    mode,
    locomotionSpeed: mode === 'locomotion' ? 3 : 0,
    locomotionDirection: { x: 0, z: -1 },
    facing: { x: 0, z: -1 },
    action: committed
      ? {
          actionId: `player.${mode}`,
          executionId: 1,
          phase,
          normalizedPhaseProgress: progress,
        }
      : null,
    hitReactionToken: mode === 'hit-reaction' ? 'hit:1' : null,
    transition: { blendSeconds: 0.1, defeatedOverride: mode === 'defeated' },
  }
}

describe('player procedural pose', () => {
  it('keeps idle restrained and stops locomotion limbs at idle', () => {
    const idle = resolvePlayerProceduralPose(state('idle'), 30)
    const locomotion = resolvePlayerProceduralPose(state('locomotion'), 30)
    expect(Math.abs(idle.bodyOffsetY)).toBeLessThan(0.01)
    expect(idle.limbSwing).toBe(0)
    expect(Math.abs(locomotion.limbSwing)).toBeGreaterThan(0.05)
  })

  it('projects light and heavy phase progress deterministically', () => {
    const first = resolvePlayerProceduralPose(state('light-attack', 'active', 0.4), 20)
    const repeated = resolvePlayerProceduralPose(state('light-attack', 'active', 0.4), 20)
    const heavy = resolvePlayerProceduralPose(state('heavy-attack', 'active', 0.4), 20)
    expect(repeated).toEqual(first)
    expect(Math.abs(heavy.torsoPitch)).toBeGreaterThan(Math.abs(first.torsoPitch))
  })

  it.each(['guard', 'dodge', 'heal', 'hit-reaction'] as const)(
    'provides a distinct %s pose',
    (mode) => {
      expect(resolvePlayerProceduralPose(state(mode), 10)).not.toEqual(
        resolvePlayerProceduralPose(state('idle'), 10),
      )
    },
  )

  it('makes defeat a stable override pose', () => {
    expect(resolvePlayerProceduralPose(state('defeated'), 1)).toMatchObject({
      defeated: true,
      bodyScaleY: 0.28,
      bodyRoll: Math.PI / 2.35,
    })
  })
})
