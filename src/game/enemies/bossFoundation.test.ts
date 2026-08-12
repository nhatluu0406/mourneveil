import { describe, expect, it } from 'vitest'
import {
  BOSS_DEFINITION_ID,
  BOSS_ENCOUNTER_ID,
  BOSS_RUNTIME_ID,
  BOSS_TECHNICAL_ID,
  resolveBossPhase,
} from './bossKit'
import { BOSS_ROLE, createEnemyRuntimeFromRole } from './enemyRoles'
import { advanceMeleeEnemy, createEnemyAttackSpatialSnapshot, enemyAttackDamage } from './meleeEnemy'
import { ENEMY_INTERRUPT_THRESHOLD } from './enemyHitReaction'
import { GameRuntime } from '../runtime/GameRuntime'
import { createDefaultSaveV4 } from '../save/saveSchema'
import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from '../world/checkpoint'

describe('boss foundation', () => {
  it('creates boss runtime with full kit and high interrupt threshold', () => {
    const boss = createEnemyRuntimeFromRole(BOSS_ROLE)
    expect(boss.id).toBe(BOSS_RUNTIME_ID)
    expect(boss.definition.id).toBe(BOSS_DEFINITION_ID)
    expect(boss.definition.attackActionIds).toHaveLength(4)
    expect(ENEMY_INTERRUPT_THRESHOLD.boss).toBe(3)
    expect(boss.snapshot().health.maximum).toBe(420)
  })

  it('selects kit contacts for active boss attacks', () => {
    const boss = createEnemyRuntimeFromRole(BOSS_ROLE)
    boss.transition('pursue', 'player')
    boss.startAction(boss.definition.attackActionIds[0]!, { x: 0, z: 1 })
    for (let step = 0; step < BOSS_ROLE.attack.startupSteps; step += 1) {
      boss.advanceAction()
    }
    const spatial = createEnemyAttackSpatialSnapshot(boss.snapshot())
    expect(spatial.contactEnabled).toBe(true)
    expect(spatial.activeContactShape?.actionId).toBe(boss.definition.attackActionIds[0])
    expect(enemyAttackDamage(boss.snapshot())).toBeGreaterThan(0)
  })

  it('advances boss into attack with deterministic kit selection', () => {
    const boss = createEnemyRuntimeFromRole(BOSS_ROLE)
    const player = { x: boss.snapshot().position.x - 1.2, y: 0.82, z: boss.snapshot().position.z }
    for (let step = 0; step < 90; step += 1) {
      advanceMeleeEnemy(boss, player, 1 / 60, null, {
        targetAlive: true,
        simulationStep: step,
      })
      if (boss.snapshot().state === 'attack') break
    }
    expect(boss.snapshot().state).toBe('attack')
    expect(boss.snapshot().action.actionId).toMatch(/^enemy\.boss\./)
  })

  it('transitions phase at half HP', () => {
    const boss = createEnemyRuntimeFromRole(BOSS_ROLE)
    const half = Math.floor(boss.snapshot().health.maximum * 0.5)
    boss.applyDamage(boss.snapshot().health.current - half)
    expect(resolveBossPhase(boss.snapshot().health.current, boss.snapshot().health.maximum)).toBe(2)
  })

  it('activates arena encounter, damages, defeats, and persists defeat across respawn', () => {
    const runtime = new GameRuntime()
    runtime.applySave({
      ...createDefaultSaveV4(),
      checkpointActivated: true,
      activeCheckpointId: CONNECTED_LEVEL_CHECKPOINT_DEFINITION.id,
      world: {
        openedShortcutIds: [],
        finalGateReached: true,
        defeatedBossIds: [],
      },
    })
    runtime.debugSetPlayerPosition({ x: 13, y: 0.82, z: -3 })
    for (let step = 0; step < 5; step += 1) {
      runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    }
    const snap = runtime.snapshot()
    expect(snap.encounterActivation.activatedEncounterIds).toContain(BOSS_ENCOUNTER_ID)
    const boss = snap.enemies.find((enemy) => enemy.id === BOSS_RUNTIME_ID)
    expect(boss?.alive).toBe(true)

    runtime.debugDefeatEnemy(BOSS_RUNTIME_ID)
    expect(runtime.snapshot().enemies.find((enemy) => enemy.id === BOSS_RUNTIME_ID)?.alive).toBe(false)
    expect(runtime.snapshot().world.defeatedBossIds).toContain(BOSS_TECHNICAL_ID)
    expect(runtime.captureSave().world.defeatedBossIds).toContain(BOSS_TECHNICAL_ID)

    runtime.applyPlayerDamage(999)
    runtime.requestRespawn({ type: 'player-respawn' })
    expect(runtime.snapshot().enemies.find((enemy) => enemy.id === BOSS_RUNTIME_ID)?.alive).toBe(false)
  })
})
