import { describe, expect, it } from 'vitest'
import { CombatActionRuntime } from '../combat/combatActionRuntime'
import { PlayerDefenseRuntime } from '../combat/playerDefense'
import {
  DEFAULT_EQUIPPED_SKILL_ID,
  SKILL_DEFINITIONS,
  SKILL_OATH_CLEAVE,
  SKILL_OATH_CLEAVE_ID,
  SKILL_VEIL_STEP,
  SKILL_VEIL_STEP_ID,
  SKILL_WARD_PULSE,
  SKILL_WARD_PULSE_ID,
  getSkillDefinition,
  skillCombatActions,
  unlockedSkillIdsForLevel,
} from './skillDefinition'
import { PlayerSkillRuntime } from './playerSkills'

describe('skill definitions', () => {
  it('resolves the three authored skills with immutable contracts', () => {
    expect(SKILL_DEFINITIONS).toHaveLength(3)
    expect(getSkillDefinition(SKILL_VEIL_STEP_ID)?.effect.kind).toBe('reposition')
    expect(getSkillDefinition(SKILL_OATH_CLEAVE_ID)?.effect.kind).toBe('empowered-melee')
    expect(getSkillDefinition(SKILL_WARD_PULSE_ID)?.effect.kind).toBe('guard-relief')
    expect(SKILL_VEIL_STEP.effect.kind === 'reposition' && SKILL_VEIL_STEP.effect.invulnerable).toBe(
      false,
    )
  })

  it('unlocks by level milestones', () => {
    expect(unlockedSkillIdsForLevel(1)).toEqual([SKILL_VEIL_STEP_ID])
    expect(unlockedSkillIdsForLevel(2)).toEqual([SKILL_VEIL_STEP_ID, SKILL_OATH_CLEAVE_ID])
    expect(unlockedSkillIdsForLevel(3)).toEqual([
      SKILL_VEIL_STEP_ID,
      SKILL_OATH_CLEAVE_ID,
      SKILL_WARD_PULSE_ID,
    ])
  })
})

describe('player skill runtime', () => {
  it('equips unlocked skills and rejects locked/unknown/busy states', () => {
    const skills = new PlayerSkillRuntime()
    skills.syncLevel(1)
    expect(skills.equip(SKILL_OATH_CLEAVE_ID, { alive: true, combatIdle: true })).toEqual({
      accepted: false,
      reason: 'locked',
    })
    skills.syncLevel(2)
    expect(skills.equip(SKILL_OATH_CLEAVE_ID, { alive: true, combatIdle: true })).toEqual({
      accepted: true,
      skillId: SKILL_OATH_CLEAVE_ID,
    })
    expect(skills.equip('skill.unknown', { alive: true, combatIdle: true }).accepted).toBe(false)
    expect(skills.equip(SKILL_VEIL_STEP_ID, { alive: true, combatIdle: false })).toEqual({
      accepted: false,
      reason: 'combat-busy',
    })
    expect(skills.durableEquippedSkillId()).toBe(SKILL_OATH_CLEAVE_ID)
  })

  it('gates activation on cooldown and idle/guard rules', () => {
    const skills = new PlayerSkillRuntime()
    expect(
      skills.activationGate({
        alive: true,
        combatIdle: true,
        canStartAction: true,
        cooldownRemaining: 0,
      }).allowed,
    ).toBe(true)
    expect(
      skills.activationGate({
        alive: true,
        combatIdle: true,
        canStartAction: true,
        cooldownRemaining: 12,
      }),
    ).toMatchObject({ allowed: false, reason: 'cooldown-active' })
    expect(
      skills.activationGate({
        alive: true,
        combatIdle: false,
        canStartAction: true,
        cooldownRemaining: 0,
      }),
    ).toMatchObject({ allowed: false, reason: 'combat-busy' })
  })

  it('projects cooldown ratio and defaults to Veil Step', () => {
    const skills = new PlayerSkillRuntime()
    const combat = new CombatActionRuntime(skillCombatActions())
    expect(skills.durableEquippedSkillId()).toBe(DEFAULT_EQUIPPED_SKILL_ID)
    const snap = skills.snapshot(combat.snapshot(), {
      remainingSteps: (id) => combat.cooldownRemainingSteps(id),
    })
    expect(snap.ready).toBe(true)
    expect(snap.cooldownRatio).toBe(0)
    expect(snap.unlockedSkillIds).toEqual([SKILL_VEIL_STEP_ID])
  })
})

describe('skill combat composition', () => {
  it('starts Veil Step and enters cooldown after completion', () => {
    const combat = new CombatActionRuntime(skillCombatActions())
    const skills = new PlayerSkillRuntime()
    const start = combat.request({ type: 'start-action', actionId: SKILL_VEIL_STEP_ID })
    expect(start.accepted).toBe(true)
    if (!start.accepted) return
    skills.acceptActivation(start, { x: 0, z: -1 })
    const total =
      SKILL_VEIL_STEP.action.startupSteps +
      SKILL_VEIL_STEP.action.activeSteps +
      SKILL_VEIL_STEP.action.recoverySteps
    for (let step = 0; step < total; step += 1) combat.advanceFixedStep()
    expect(combat.snapshot().phase).toBe('idle')
    expect(combat.cooldownRemainingSteps(SKILL_VEIL_STEP_ID)).toBe(
      SKILL_VEIL_STEP.action.cooldownSteps,
    )
    expect(
      combat.request({ type: 'start-action', actionId: SKILL_VEIL_STEP_ID }),
    ).toMatchObject({ accepted: false, reason: 'cooldown-active' })
  })

  it('applies Ward Pulse guard relief through defense authority', () => {
    const combat = new CombatActionRuntime(skillCombatActions())
    const defense = new PlayerDefenseRuntime()
    const skills = new PlayerSkillRuntime()
    skills.syncLevel(3)
    skills.equip(SKILL_WARD_PULSE_ID, { alive: true, combatIdle: true })
    defense.setGuardIntent(true)
    defense.advanceFixedStep(combat.snapshot())
    // Build pressure via guarded hits
    for (let i = 0; i < 2; i += 1) {
      defense.resolveIncomingMelee(combat.snapshot(), { x: 0, z: -1 }, { x: 0, z: 1 }, 1)
    }
    expect(defense.snapshot(combat.snapshot()).guardImpact).toBe(2)

    const start = combat.request({ type: 'start-action', actionId: SKILL_WARD_PULSE_ID })
    expect(start.accepted).toBe(true)
    if (!start.accepted) return
    skills.acceptActivation(start, null)
    for (let step = 0; step < SKILL_WARD_PULSE.action.startupSteps; step += 1) {
      combat.advanceFixedStep()
      skills.advanceFixedStep(combat.snapshot())
    }
    expect(combat.snapshot().phase).toBe('active')
    expect(skills.consumeWardPulseApplication(combat.snapshot())).toBe(true)
    const effect = SKILL_WARD_PULSE.effect
    if (effect.kind !== 'guard-relief') throw new Error('expected guard-relief')
    defense.applyWardPulse({
      clearImpact: effect.clearImpact,
      temporaryThresholdBonus: effect.temporaryThresholdBonus,
      temporaryDurationSteps: effect.temporaryDurationSteps,
    })
    const after = defense.snapshot(combat.snapshot())
    expect(after.guardImpact).toBe(0)
    expect(after.guardImpactThreshold).toBe(4)
  })

  it('Oath Cleave uses empowered contact shape and authored bonus', () => {
    expect(SKILL_OATH_CLEAVE.effect.kind).toBe('empowered-melee')
    if (SKILL_OATH_CLEAVE.effect.kind !== 'empowered-melee') return
    expect(SKILL_OATH_CLEAVE.effect.damageBonus).toBe(12)
    expect(SKILL_OATH_CLEAVE.effect.contactShape.radius).toBeGreaterThan(0.68)
  })
})
