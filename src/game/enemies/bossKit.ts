import type { CombatActionDefinition } from '../combat/combatAction'
import { defineCombatAction } from '../combat/combatAction'
import type { EnemyMeleeContactShape } from './enemyRoles'

/** Technical boss identity — presentation display name is Codex-owned later. */
export const BOSS_TECHNICAL_ID = 'boss.veilbound-sepulchre' as const
export const BOSS_DEFINITION_ID = 'enemy.boss.veilbound-sepulchre' as const
export const BOSS_RUNTIME_ID = 'enemy.boss.sepulchre.1' as const
export const BOSS_ENCOUNTER_ID = 'encounter.m11.boss' as const

/** HP ratio at or below this enters phase 2 (deterministic). */
export const BOSS_PHASE_TWO_HEALTH_RATIO = 0.5

export type BossPhase = 1 | 2

export type BossAttackKind = 'slash' | 'crush' | 'lunge' | 'slam'

export interface BossAttackSpec {
  readonly kind: BossAttackKind
  readonly attack: CombatActionDefinition
  readonly damage: number
  readonly guardImpact: number
  readonly contact: EnemyMeleeContactShape
  /** Prefer this attack at or below this player distance (meters). */
  readonly preferredMaxDistance: number
  /** Prefer this attack at or above this player distance (meters). */
  readonly preferredMinDistance: number
  /** Phase availability. */
  readonly phases: readonly BossPhase[]
}

export const BOSS_SLASH = defineCombatAction({
  id: 'enemy.boss.slash',
  startupSteps: 22,
  activeSteps: 10,
  recoverySteps: 28,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'never',
  contactWindowId: 'enemy.boss.slash.contact',
  cooldownSteps: 0,
})

export const BOSS_CRUSH = defineCombatAction({
  id: 'enemy.boss.crush',
  startupSteps: 40,
  activeSteps: 12,
  recoverySteps: 44,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'never',
  contactWindowId: 'enemy.boss.crush.contact',
  cooldownSteps: 0,
})

export const BOSS_LUNGE = defineCombatAction({
  id: 'enemy.boss.lunge',
  startupSteps: 26,
  activeSteps: 14,
  recoverySteps: 32,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'never',
  contactWindowId: 'enemy.boss.lunge.contact',
  cooldownSteps: 0,
})

export const BOSS_SLAM = defineCombatAction({
  id: 'enemy.boss.slam',
  startupSteps: 36,
  activeSteps: 16,
  recoverySteps: 48,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'never',
  contactWindowId: 'enemy.boss.slam.contact',
  cooldownSteps: 0,
})

function contact(
  actionId: string,
  windowId: string,
  forwardOffset: number,
  radius: number,
): EnemyMeleeContactShape {
  return Object.freeze({
    id: `${actionId}.sphere`,
    kind: 'sphere',
    actionId,
    windowId,
    forwardOffset,
    radius,
  })
}

export const BOSS_ATTACK_KIT: readonly BossAttackSpec[] = Object.freeze([
  Object.freeze({
    kind: 'slash',
    attack: BOSS_SLASH,
    damage: 18,
    guardImpact: 1,
    contact: contact(BOSS_SLASH.id, BOSS_SLASH.contactWindowId!, 0.95, 0.55),
    preferredMinDistance: 0,
    preferredMaxDistance: 1.9,
    phases: [1, 2] as const,
  }),
  Object.freeze({
    kind: 'crush',
    attack: BOSS_CRUSH,
    damage: 32,
    guardImpact: 2,
    contact: contact(BOSS_CRUSH.id, BOSS_CRUSH.contactWindowId!, 1.05, 0.72),
    preferredMinDistance: 0,
    preferredMaxDistance: 2.2,
    phases: [1, 2] as const,
  }),
  Object.freeze({
    kind: 'lunge',
    attack: BOSS_LUNGE,
    damage: 22,
    guardImpact: 1,
    contact: contact(BOSS_LUNGE.id, BOSS_LUNGE.contactWindowId!, 1.35, 0.58),
    preferredMinDistance: 1.6,
    preferredMaxDistance: 4.2,
    phases: [1, 2] as const,
  }),
  Object.freeze({
    kind: 'slam',
    attack: BOSS_SLAM,
    damage: 36,
    guardImpact: 2,
    contact: contact(BOSS_SLAM.id, BOSS_SLAM.contactWindowId!, 0.7, 1.05),
    preferredMinDistance: 0,
    preferredMaxDistance: 2.6,
    phases: [2] as const,
  }),
])

export function resolveBossPhase(healthCurrent: number, healthMaximum: number): BossPhase {
  if (healthMaximum <= 0) return 1
  return healthCurrent / healthMaximum <= BOSS_PHASE_TWO_HEALTH_RATIO ? 2 : 1
}

export function bossAttackByActionId(actionId: string): BossAttackSpec | null {
  return BOSS_ATTACK_KIT.find((entry) => entry.attack.id === actionId) ?? null
}
