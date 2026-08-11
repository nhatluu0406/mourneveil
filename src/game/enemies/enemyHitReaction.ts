import type { CombatActionId, CombatActionPhase } from '../combat/combatAction'
import {
  PLAYER_HEAVY_ATTACK_ID,
  PLAYER_LIGHT_ATTACK_ID,
} from '../combat/playerAttackActions'
import type { EnemyRole } from './enemyDefinition'
import type { EnemyState } from './enemyRuntime'

/** Fixed-step hit-reaction duration (~333ms at 60 Hz). */
export const ENEMY_HIT_REACTION_DURATION_STEPS = 20
/** Brief immunity after recovery so the same pressure cannot immediately re-stun. */
export const ENEMY_HIT_REACTION_IMMUNITY_STEPS = 12
/** Quiet steps without another interrupt-capable hit clear accumulated interrupt meter. */
export const ENEMY_INTERRUPT_METER_QUIET_RESET_STEPS = 90

export const PLAYER_ATTACK_INTERRUPT_IMPACT = Object.freeze({
  [PLAYER_LIGHT_ATTACK_ID]: 0,
  [PLAYER_HEAVY_ATTACK_ID]: 1,
} as const satisfies Record<string, number>)

export const ENEMY_INTERRUPT_THRESHOLD: Readonly<Record<EnemyRole, number>> = Object.freeze({
  skirmisher: 1,
  brute: 2,
})

export function interruptImpactForPlayerAction(actionId: CombatActionId): number {
  return PLAYER_ATTACK_INTERRUPT_IMPACT[actionId as keyof typeof PLAYER_ATTACK_INTERRUPT_IMPACT] ?? 0
}

export function enemyInterruptThreshold(role: EnemyRole): number {
  return ENEMY_INTERRUPT_THRESHOLD[role]
}

/**
 * Authoritative phase gate for interruption.
 * Attack active is committed and non-interruptible; startup/recovery may cancel.
 */
export function enemyPhaseAllowsInterrupt(
  state: EnemyState,
  actionPhase: CombatActionPhase | 'idle',
): boolean {
  if (state === 'defeated' || state === 'hitReaction') return false
  if (state === 'attack' && actionPhase === 'active') return false
  return (
    state === 'idle' ||
    state === 'pursue' ||
    state === 'spacing' ||
    state === 'attack' ||
    state === 'recovery'
  )
}
