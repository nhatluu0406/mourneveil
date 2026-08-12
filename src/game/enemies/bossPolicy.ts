import type { CombatActionId } from '../combat/combatAction'
import {
  BOSS_ATTACK_KIT,
  type BossAttackKind,
  type BossPhase,
  resolveBossPhase,
} from './bossKit'

export interface BossAttackSelectionInput {
  readonly healthCurrent: number
  readonly healthMaximum: number
  readonly playerDistance: number
  readonly previousAttackId: CombatActionId | null
  readonly simulationStep: number
}

export interface BossAttackSelection {
  readonly actionId: CombatActionId
  readonly kind: BossAttackKind
  readonly phase: BossPhase
}

/**
 * Deterministic boss attack selection.
 * Prefers distance-fit attacks for the current phase; avoids immediate repeats when alternatives exist.
 */
export function selectBossAttack(input: BossAttackSelectionInput): BossAttackSelection {
  const phase = resolveBossPhase(input.healthCurrent, input.healthMaximum)
  const candidates = BOSS_ATTACK_KIT.filter((entry) => entry.phases.includes(phase))
  const inRange = candidates.filter(
    (entry) =>
      input.playerDistance >= entry.preferredMinDistance &&
      input.playerDistance <= entry.preferredMaxDistance,
  )
  const pool = inRange.length > 0 ? inRange : candidates
  const withoutRepeat =
    input.previousAttackId === null
      ? pool
      : pool.filter((entry) => entry.attack.id !== input.previousAttackId)
  const finalPool = withoutRepeat.length > 0 ? withoutRepeat : pool
  // Stable pick: rotate by simulation step among sorted kinds for determinism.
  const ordered = [...finalPool].sort((left, right) => left.kind.localeCompare(right.kind))
  const index = ((input.simulationStep % ordered.length) + ordered.length) % ordered.length
  const chosen = ordered[index]!
  return {
    actionId: chosen.attack.id,
    kind: chosen.kind,
    phase,
  }
}
