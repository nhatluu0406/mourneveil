import { describe, expect, it } from 'vitest'
import type { CombatActionSnapshot } from '../../game/combat/combatActionRuntime'
import type { CharacterCollisionResolver } from '../../game/character/playerMotor'
import { GameRuntime } from '../../game/runtime/GameRuntime'
import { projectPlayerAnimation } from './playerAnimationProjection'
import { normalizedActionPhaseProgress } from './animationPresentation'

const STILL = { horizontal: 0, forward: 0 } as const
const AIM_FORWARD = { x: 0, z: -1 } as const
const FLAT_GROUND: CharacterCollisionResolver = (_position, translation) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})

function advanceToPhase(runtime: GameRuntime, phase: 'startup' | 'active' | 'recovery'): void {
  for (let step = 0; step < 100; step += 1) {
    if (runtime.snapshot().combat.phase === phase) return
    runtime.advanceFrame(1 / 60, STILL)
  }
  throw new Error(`Player action never reached ${phase}`)
}

describe('animation presentation architecture', () => {
  it('projects authoritative idle and locomotion without mutating runtime state', () => {
    const runtime = new GameRuntime()
    const before = runtime.snapshot()
    expect(projectPlayerAnimation(before).mode).toBe('idle')
    expect(runtime.snapshot()).toEqual(before)

    runtime.attachCollisionResolver(FLAT_GROUND)
    runtime.advanceFrame(1 / 60, { horizontal: 1, forward: 0 })
    const moving = projectPlayerAnimation(runtime.snapshot())
    expect(moving.mode).toBe('locomotion')
    expect(moving.locomotionSpeed).toBeGreaterThan(0)
    expect(moving.facing).toEqual(runtime.snapshot().player.facing)
  })

  it.each(['startup', 'active', 'recovery'] as const)(
    'projects light combat %s and deterministic phase progress',
    (phase) => {
      const runtime = new GameRuntime()
      runtime.requestPlayerAttack({
        type: 'player-attack',
        attack: 'light',
        aimDirection: AIM_FORWARD,
      })
      advanceToPhase(runtime, phase)
      const snapshot = runtime.snapshot()
      const presentation = projectPlayerAnimation(snapshot)
      expect(presentation.mode).toBe('light-attack')
      expect(presentation.action?.phase).toBe(phase)
      expect(presentation.action?.normalizedPhaseProgress).toBe(
        normalizedActionPhaseProgress(snapshot.combat),
      )
    },
  )

  it('projects heavy, dodge, guard, and heal from authoritative states', () => {
    const heavy = new GameRuntime()
    heavy.requestPlayerAttack({
      type: 'player-attack',
      attack: 'heavy',
      aimDirection: AIM_FORWARD,
    })
    expect(projectPlayerAnimation(heavy.snapshot()).mode).toBe('heavy-attack')

    const dodge = new GameRuntime()
    dodge.requestPlayerDodge({ type: 'player-dodge' }, STILL)
    expect(projectPlayerAnimation(dodge.snapshot()).mode).toBe('dodge')

    const guard = new GameRuntime()
    guard.setGuardIntent(true)
    guard.advanceFrame(1 / 60, STILL)
    expect(projectPlayerAnimation(guard.snapshot()).mode).toBe('guard')

    const heal = new GameRuntime()
    heal.applyPlayerDamage(20)
    heal.requestPlayerFlaskUse({ type: 'player-flask-use' })
    expect(projectPlayerAnimation(heal.snapshot()).mode).toBe('heal')
  })

  it('gives committed actions precedence over hit overlay and defeat precedence over all', () => {
    const runtime = new GameRuntime()
    runtime.requestPlayerAttack({
      type: 'player-attack',
      attack: 'light',
      aimDirection: AIM_FORWARD,
    })
    runtime.applyPlayerDamage(10)
    expect(projectPlayerAnimation(runtime.snapshot()).mode).toBe('light-attack')

    runtime.applyPlayerDamage(1000)
    const defeated = projectPlayerAnimation(runtime.snapshot())
    expect(defeated.mode).toBe('defeated')
    expect(defeated.transition.defeatedOverride).toBe(true)
  })

  it('uses hit reaction ahead of guard and locomotion when no action is committed', () => {
    const runtime = new GameRuntime()
    runtime.setGuardIntent(true)
    runtime.advanceFrame(1 / 60, STILL)
    const source = runtime.snapshot()
    const withHit = {
      ...source,
      incomingContact: {
        totalHitCount: 1,
        lastHit: {
          type: 'combat-hit' as const,
          attackerId: 'enemy.test',
          targetId: 'player',
          actionId: 'enemy.attack',
          executionId: 4,
          contactWindowId: 'enemy.attack.contact',
          contactPosition: { x: 0, y: 0.82, z: 0 },
          damage: 10,
          appliedDamage: 10,
          outcome: 'damaged' as const,
          simulationStep: source.simulation.stepCount,
        },
      },
    }
    expect(projectPlayerAnimation(withHit).mode).toBe('hit-reaction')
  })

  it('clamps normalized phase progress deterministically', () => {
    const action: CombatActionSnapshot = {
      actionId: 'test',
      executionId: 1,
      phase: 'active',
      phaseElapsedSteps: 7,
      phaseRemainingSteps: 0,
      phaseDurationSteps: 4,
      totalElapsedSteps: 7,
      contact: { enabled: false, actionId: null, windowId: null },
    }
    expect(normalizedActionPhaseProgress(action)).toBe(1)
    expect(normalizedActionPhaseProgress({ ...action, phase: 'idle' })).toBe(0)
  })
})
