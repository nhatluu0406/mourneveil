import type { CombatHitEvent } from '../game/combat/combatContact'
import {
  PLAYER_HEAVY_ATTACK_ID,
  PLAYER_LIGHT_ATTACK_ID,
} from '../game/combat/playerAttackActions'
import type { EnemyRuntimeSnapshot } from '../game/enemies/enemyRuntime'

export type PlayerOutgoingHitConfirmKind =
  | 'none'
  | 'light'
  | 'heavy'
  | 'interrupt'
  | 'defeat'

export interface PlayerOutgoingHitConfirm {
  readonly kind: PlayerOutgoingHitConfirmKind
  readonly confirmKey: string | null
  /** 0..1 material flash strength. */
  readonly flashIntensity: number
  /** Multiplier on the base camera hit impulse distance. */
  readonly cameraImpulseScale: number
  readonly flashSteps: number
}

const NONE: PlayerOutgoingHitConfirm = Object.freeze({
  kind: 'none',
  confirmKey: null,
  flashIntensity: 0,
  cameraImpulseScale: 0,
  flashSteps: 0,
})

/**
 * Projects authoritative outgoing contact into a readable confirmation hierarchy.
 * Miss (no lastHit) yields none. Same confirmKey must not retrigger presentation.
 */
export function resolvePlayerOutgoingHitConfirm(input: {
  readonly lastHit: CombatHitEvent | null
  readonly enemies: readonly Pick<
    EnemyRuntimeSnapshot,
    'id' | 'alive' | 'state'
  >[]
  readonly simulationStep: number
  readonly maxAgeSteps?: number
}): PlayerOutgoingHitConfirm {
  const hit = input.lastHit
  if (hit === null || hit.outcome !== 'damaged') return NONE
  const maxAge = input.maxAgeSteps ?? 18
  if (input.simulationStep - hit.simulationStep > maxAge) return NONE

  const target = input.enemies.find((enemy) => enemy.id === hit.targetId) ?? null
  const confirmKey = `${hit.executionId}:${hit.targetId}:${hit.simulationStep}`

  if (target !== null && !target.alive) {
    return {
      kind: 'defeat',
      confirmKey,
      flashIntensity: 1,
      cameraImpulseScale: 1.55,
      flashSteps: 16,
    }
  }
  if (target?.state === 'hitReaction') {
    return {
      kind: 'interrupt',
      confirmKey,
      flashIntensity: 0.9,
      cameraImpulseScale: 1.35,
      flashSteps: 14,
    }
  }
  if (hit.actionId === PLAYER_HEAVY_ATTACK_ID) {
    return {
      kind: 'heavy',
      confirmKey,
      flashIntensity: 0.7,
      cameraImpulseScale: 1.05,
      flashSteps: 12,
    }
  }
  if (hit.actionId === PLAYER_LIGHT_ATTACK_ID) {
    return {
      kind: 'light',
      confirmKey,
      flashIntensity: 0.45,
      cameraImpulseScale: 0.7,
      flashSteps: 10,
    }
  }
  return {
    kind: 'light',
    confirmKey,
    flashIntensity: 0.4,
    cameraImpulseScale: 0.65,
    flashSteps: 10,
  }
}

export function isDuplicateHitConfirm(
  previousKey: string | null,
  next: PlayerOutgoingHitConfirm,
): boolean {
  return next.confirmKey !== null && next.confirmKey === previousKey
}
