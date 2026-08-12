import { defineCombatAction, type CombatActionDefinition } from '../combat/combatAction'
import type { PlayerAttackContactShapeDefinition } from '../combat/playerAttackActions'

export type SkillId =
  | 'skill.veil-step'
  | 'skill.oath-cleave'
  | 'skill.ward-pulse'

export type SkillCategory = 'mobility' | 'offense' | 'defense'

export type SkillEffectDescriptor =
  | {
      readonly kind: 'reposition'
      readonly speed: number
      readonly invulnerable: false
    }
  | {
      readonly kind: 'empowered-melee'
      readonly contactShape: PlayerAttackContactShapeDefinition
      /** Flat damage added on top of resolved heavy (Might-composed) damage. */
      readonly damageBonus: number
    }
  | {
      readonly kind: 'guard-relief'
      readonly clearImpact: true
      readonly temporaryThresholdBonus: number
      readonly temporaryDurationSteps: number
    }

export interface SkillDefinition {
  readonly id: SkillId
  readonly displayName: string
  readonly shortDescription: string
  readonly category: SkillCategory
  readonly unlockLevel: number
  readonly action: CombatActionDefinition
  readonly effect: SkillEffectDescriptor
  readonly semanticPresentationId: string
}

export const SKILL_VEIL_STEP_ID = 'skill.veil-step' as const
export const SKILL_OATH_CLEAVE_ID = 'skill.oath-cleave' as const
export const SKILL_WARD_PULSE_ID = 'skill.ward-pulse' as const

export const SKILL_INPUT_BINDING_LABEL = 'Q' as const
export const SKILL_INPUT_CODE = 'KeyQ' as const

const VEIL_STEP_ACTION = defineCombatAction({
  id: SKILL_VEIL_STEP_ID,
  startupSteps: 3,
  activeSteps: 12,
  recoverySteps: 10,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'always',
  contactWindowId: null,
  cooldownSteps: 180,
})

const OATH_CLEAVE_ACTION = defineCombatAction({
  id: SKILL_OATH_CLEAVE_ID,
  startupSteps: 14,
  activeSteps: 7,
  recoverySteps: 28,
  resourceCost: null,
  cancellationPolicy: 'recovery-only',
  interruptibilityPolicy: 'always',
  contactWindowId: 'skill.oath-cleave.contact',
  cooldownSteps: 210,
})

const WARD_PULSE_ACTION = defineCombatAction({
  id: SKILL_WARD_PULSE_ID,
  startupSteps: 6,
  activeSteps: 1,
  recoverySteps: 14,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'always',
  contactWindowId: null,
  cooldownSteps: 240,
})

export const SKILL_VEIL_STEP: SkillDefinition = Object.freeze({
  id: SKILL_VEIL_STEP_ID,
  displayName: 'Veil Step',
  shortDescription: 'Short collision-safe reposition. No invulnerability.',
  category: 'mobility',
  unlockLevel: 1,
  action: VEIL_STEP_ACTION,
  effect: Object.freeze({
    kind: 'reposition' as const,
    speed: 11,
    invulnerable: false as const,
  }),
  semanticPresentationId: 'skill.veil-step',
})

export const SKILL_OATH_CLEAVE: SkillDefinition = Object.freeze({
  id: SKILL_OATH_CLEAVE_ID,
  displayName: 'Oath Cleave',
  shortDescription: 'Committed empowered melee strike. Uses Might.',
  category: 'offense',
  unlockLevel: 2,
  action: OATH_CLEAVE_ACTION,
  effect: Object.freeze({
    kind: 'empowered-melee' as const,
    contactShape: Object.freeze({
      id: 'skill.oath-cleave.sphere',
      kind: 'sphere' as const,
      actionId: SKILL_OATH_CLEAVE_ID,
      windowId: 'skill.oath-cleave.contact',
      forwardOffset: 1.12,
      radius: 0.86,
    }),
    damageBonus: 12,
  }),
  semanticPresentationId: 'skill.oath-cleave',
})

export const SKILL_WARD_PULSE: SkillDefinition = Object.freeze({
  id: SKILL_WARD_PULSE_ID,
  displayName: 'Ward Pulse',
  shortDescription: 'Clear guard pressure and briefly firm the ward.',
  category: 'defense',
  unlockLevel: 3,
  action: WARD_PULSE_ACTION,
  effect: Object.freeze({
    kind: 'guard-relief' as const,
    clearImpact: true as const,
    temporaryThresholdBonus: 1,
    temporaryDurationSteps: 90,
  }),
  semanticPresentationId: 'skill.ward-pulse',
})

export const SKILL_DEFINITIONS = Object.freeze([
  SKILL_VEIL_STEP,
  SKILL_OATH_CLEAVE,
  SKILL_WARD_PULSE,
])

export const DEFAULT_EQUIPPED_SKILL_ID: SkillId = SKILL_VEIL_STEP_ID

export function getSkillDefinition(skillId: string): SkillDefinition | null {
  return SKILL_DEFINITIONS.find((definition) => definition.id === skillId) ?? null
}

export function skillUnlockedAtLevel(skillId: SkillId, level: number): boolean {
  const definition = getSkillDefinition(skillId)
  if (definition === null) return false
  return level >= definition.unlockLevel
}

export function unlockedSkillIdsForLevel(level: number): readonly SkillId[] {
  return SKILL_DEFINITIONS.filter((definition) => level >= definition.unlockLevel).map(
    (definition) => definition.id,
  )
}

export function skillCombatActions(): readonly CombatActionDefinition[] {
  return SKILL_DEFINITIONS.map((definition) => definition.action)
}

export function isSkillId(value: string): value is SkillId {
  return getSkillDefinition(value) !== null
}
