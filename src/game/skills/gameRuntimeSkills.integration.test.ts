import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../runtime/GameRuntime'
import { PLAYER_SKILL_USE_REQUEST } from '../../input/playerSkillIntent'
import {
  SKILL_OATH_CLEAVE_ID,
  SKILL_VEIL_STEP,
  SKILL_VEIL_STEP_ID,
  SKILL_WARD_PULSE_ID,
} from './skillDefinition'

describe('GameRuntime active skills', () => {
  it('activates Veil Step, starts cooldown, and blocks reactivation', () => {
    const runtime = new GameRuntime()
    const start = runtime.requestPlayerSkillUse(PLAYER_SKILL_USE_REQUEST, {
      horizontal: 0,
      forward: 1,
    })
    expect(start).toMatchObject({ accepted: true, actionId: SKILL_VEIL_STEP_ID })
    const total =
      SKILL_VEIL_STEP.action.startupSteps +
      SKILL_VEIL_STEP.action.activeSteps +
      SKILL_VEIL_STEP.action.recoverySteps
    for (let step = 0; step < total; step += 1) {
      runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    }
    expect(runtime.snapshot().skills.cooldownRemainingSteps).toBe(
      SKILL_VEIL_STEP.action.cooldownSteps,
    )
    expect(
      runtime.requestPlayerSkillUse(PLAYER_SKILL_USE_REQUEST, {
        horizontal: 0,
        forward: 0,
      }),
    ).toMatchObject({ accepted: false, reason: 'cooldown-active' })
  })

  it('rejects skill use while guarding and during light attack', () => {
    const runtime = new GameRuntime()
    runtime.setGuardIntent(true)
    runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    expect(
      runtime.requestPlayerSkillUse(PLAYER_SKILL_USE_REQUEST, {
        horizontal: 0,
        forward: 0,
      }),
    ).toMatchObject({ accepted: false, reason: 'guard-active' })
    runtime.setGuardIntent(false)
    runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    runtime.requestPlayerAttack({
      type: 'player-attack',
      attack: 'light',
      aimDirection: { x: 0, z: -1 },
    })
    expect(
      runtime.requestPlayerSkillUse(PLAYER_SKILL_USE_REQUEST, {
        horizontal: 0,
        forward: 0,
      }),
    ).toMatchObject({ accepted: false, reason: 'action-in-progress' })
  })

  it('unlocks, equips, and persists Oath Cleave without cooldown', () => {
    const runtime = new GameRuntime()
    runtime.debugDefeatEnemy('enemy.skirmisher.1')
    runtime.debugDefeatEnemy('enemy.skirmisher.pressure')
    expect(runtime.equipSkill(SKILL_OATH_CLEAVE_ID).accepted).toBe(true)
    const save = runtime.captureSave()
    expect(save.skills.equippedSkillId).toBe(SKILL_OATH_CLEAVE_ID)
    expect(save).not.toHaveProperty('cooldownRemainingSteps')

    const restored = new GameRuntime()
    restored.applySave(save)
    expect(restored.snapshot().skills).toMatchObject({
      equippedSkillId: SKILL_OATH_CLEAVE_ID,
      ready: true,
      cooldownRemainingSteps: 0,
    })
  })

  it('clears transient skill cooldown on death/respawn while keeping loadout', () => {
    const runtime = new GameRuntime()
    runtime.debugDefeatEnemy('enemy.skirmisher.1')
    runtime.debugDefeatEnemy('enemy.skirmisher.pressure')
    runtime.debugDefeatEnemy('enemy.brute.1')
    runtime.debugDefeatEnemy('enemy.boss.sepulchre.1')
    expect(runtime.snapshot().progression.level).toBeGreaterThanOrEqual(3)
    expect(runtime.equipSkill(SKILL_WARD_PULSE_ID).accepted).toBe(true)
    runtime.debugSetPlayerPosition(runtime.snapshot().checkpoint.respawnPosition)
    runtime.requestCheckpointInteraction({ type: 'player-checkpoint-interaction' })
    runtime.requestPlayerSkillUse(PLAYER_SKILL_USE_REQUEST, {
      horizontal: 0,
      forward: 0,
    })
    for (let step = 0; step < 30; step += 1) {
      runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    }
    expect(runtime.snapshot().skills.cooldownRemainingSteps).toBeGreaterThan(0)
    runtime.applyPlayerDamage(999)
    runtime.requestRespawn({ type: 'player-respawn' })
    expect(runtime.snapshot().skills).toMatchObject({
      equippedSkillId: SKILL_WARD_PULSE_ID,
      cooldownRemainingSteps: 0,
      ready: true,
    })
  })
})
