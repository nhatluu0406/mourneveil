import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import { GameRuntime } from '../runtime/GameRuntime'
import { PLAYER_HEAVY_ATTACK_ID } from '../combat/playerAttackActions'
import { ENEMY_HIT_REACTION_DURATION_STEPS } from './enemyHitReaction'

describe('GameRuntime enemy hit reaction integration', () => {
  it('applies heavy interrupt after deduped damaged contact and clears reaction on fixture reset', () => {
    const runtime = new GameRuntime()
    runtime.attachCombatContactQuery(({ hurtboxes }) =>
      hurtboxes
        .filter((hurtbox) => hurtbox.ownerId !== 'player')
        .map((hurtbox) => ({ hurtboxId: hurtbox.id, targetId: hurtbox.ownerId })),
    )

    for (const enemy of runtime.snapshot().enemies) {
      if (enemy.id !== 'enemy.skirmisher.introduction') {
        runtime.debugDefeatEnemy(enemy.id)
      }
    }
    const skirmisher = runtime
      .snapshot()
      .enemies.find((entry) => entry.id === 'enemy.skirmisher.introduction')
    expect(skirmisher).toBeTruthy()
    runtime.debugSetPlayerPosition({
      x: skirmisher!.position.x,
      y: 0.82,
      z: skirmisher!.position.z - 0.9,
    })

    expect(
      runtime.requestPlayerAttack({
        type: 'player-attack',
        attack: 'heavy',
        aimDirection: { x: 0, z: 1 },
      }),
    ).toMatchObject({ accepted: true })

    let reacted = false
    for (let step = 0; step < 40; step += 1) {
      const frame = runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
      const enemy = runtime
        .snapshot()
        .enemies.find((entry) => entry.id === 'enemy.skirmisher.introduction')
      if (enemy?.state === 'hitReaction') {
        reacted = true
        expect(frame.hitEvents.some((hit) => hit.outcome === 'damaged')).toBe(true)
        expect(enemy.hitReactionRemainingSteps).toBeGreaterThan(0)
        expect(enemy.action.phase).toBe('idle')
        expect(runtime.snapshot().contact.lastHit).toMatchObject({
          actionId: PLAYER_HEAVY_ATTACK_ID,
          outcome: 'damaged',
        })
        break
      }
    }
    expect(reacted).toBe(true)

    for (let step = 0; step < ENEMY_HIT_REACTION_DURATION_STEPS + 5; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    expect(
      runtime.snapshot().enemies.find((entry) => entry.id === 'enemy.skirmisher.introduction')
        ?.state,
    ).not.toBe('hitReaction')

    runtime.resetMeleeFixture()
    expect(
      runtime.snapshot().enemies.find((entry) => entry.id === 'enemy.skirmisher.introduction'),
    ).toMatchObject({
      state: 'idle',
      hitReactionRemainingSteps: 0,
      interruptMeter: 0,
    })
  })
})
