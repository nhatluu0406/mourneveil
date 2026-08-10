import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../../game/runtime/GameRuntime'
import { projectEnemyAnimation } from './enemyAnimationProjection'
import { projectPlayerAnimation } from './playerAnimationProjection'

const STILL = { horizontal: 0, forward: 0 } as const
const LIGHT = {
  type: 'player-attack' as const,
  attack: 'light' as const,
  aimDirection: { x: 0, z: -1 },
}
const CHECKPOINT = { type: 'player-checkpoint-interaction' as const }
const RESPAWN = { type: 'player-respawn' as const }

describe('M7 animation integration', () => {
  it('clears committed, guard, hit, death, and enemy poses on respawn', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition(runtime.snapshot().checkpoint.respawnPosition)
    runtime.requestCheckpointInteraction(CHECKPOINT)
    runtime.requestPlayerAttack(LIGHT)
    runtime.applyPlayerDamage(999)

    expect(projectPlayerAnimation(runtime.snapshot()).mode).toBe('defeated')
    expect(runtime.requestRespawn(RESPAWN)).toMatchObject({ accepted: true })

    const restored = runtime.snapshot()
    expect(projectPlayerAnimation(restored)).toMatchObject({
      mode: 'idle',
      action: null,
      hitReactionToken: null,
    })
    expect(
      restored.enemies.map((enemy) =>
        projectEnemyAnimation(enemy, restored.simulation.stepCount, restored.contact),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ mode: 'idle', action: null, hitReactionToken: null }),
      ]),
    )
    expect(restored.enemies.every((enemy) => enemy.action.phase === 'idle')).toBe(true)
  })

  it('does not persist transient animation poses through save/load', () => {
    const source = new GameRuntime()
    source.requestPlayerAttack(LIGHT)
    expect(projectPlayerAnimation(source.snapshot()).mode).toBe('light-attack')

    const restored = new GameRuntime()
    restored.applySave(source.captureSave())
    expect(projectPlayerAnimation(restored.snapshot())).toMatchObject({
      mode: 'idle',
      action: null,
      hitReactionToken: null,
    })
  })

  it('keeps projection read-only across repeated connected-runtime samples', () => {
    const runtime = new GameRuntime()
    runtime.advanceFrame(1 / 60, STILL)
    const before = runtime.snapshot()
    projectPlayerAnimation(before)
    for (const enemy of before.enemies) {
      projectEnemyAnimation(enemy, before.simulation.stepCount, before.contact)
    }
    expect(runtime.snapshot()).toEqual(before)
  })
})
