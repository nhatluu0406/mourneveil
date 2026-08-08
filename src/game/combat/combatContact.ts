import type { Vector3Value } from '../character/playerMotor'
import type { CombatActionId, CombatContactWindowId } from './combatAction'
import type { CombatActionSnapshot } from './combatActionRuntime'
import {
  playerAttackForActionId,
  type ActivePlayerAttackContactShape,
  type PlayerAttackSpatialSnapshot,
} from './playerAttackActions'
import type {
  CombatHurtboxId,
  CombatTargetId,
  SphereHurtbox,
  TrainingTargetRuntime,
} from './trainingTarget'

export interface CombatContactCandidate {
  readonly hurtboxId: CombatHurtboxId
  readonly targetId: CombatTargetId
}

export interface CombatContactQueryRequest {
  readonly contactShape: ActivePlayerAttackContactShape
  readonly hurtboxes: readonly SphereHurtbox[]
}

export type CombatContactQuery = (
  request: CombatContactQueryRequest,
) => readonly CombatContactCandidate[]

export interface CombatHitEvent {
  readonly type: 'combat-hit'
  readonly attackerId: 'player'
  readonly targetId: CombatTargetId
  readonly actionId: CombatActionId
  readonly executionId: number
  readonly contactWindowId: CombatContactWindowId
  readonly contactPosition: Vector3Value
  readonly simulationStep: number
  readonly damage: number
  readonly appliedDamage: number
}

export interface CombatContactSnapshot {
  readonly totalHitCount: number
  readonly lastHit: CombatHitEvent | null
}

export interface ResolvePlayerContactRequest {
  readonly combat: CombatActionSnapshot
  readonly attack: PlayerAttackSpatialSnapshot
  readonly simulationStep: number
  readonly targets: readonly TrainingTargetRuntime[]
  readonly query: CombatContactQuery
}

const EMPTY_CONTACT_SNAPSHOT: CombatContactSnapshot = Object.freeze({
  totalHitCount: 0,
  lastHit: null,
})

export class CombatContactRuntime {
  private executionId: number | null = null
  private readonly hitTargets = new Set<CombatTargetId>()
  private totalHitCount = 0
  private lastHit: CombatHitEvent | null = null

  resolvePlayerContact(request: ResolvePlayerContactRequest): readonly CombatHitEvent[] {
    const shape = request.attack.activeContactShape
    const executionId = request.combat.executionId
    const action = playerAttackForActionId(request.combat.actionId)
    if (
      !request.combat.contact.enabled ||
      shape === null ||
      executionId === null ||
      action === null ||
      request.combat.contact.windowId !== shape.windowId
    ) {
      return []
    }

    this.beginExecution(executionId)
    const liveTargets = request.targets.filter(
      (target) => target.snapshot().health.alive,
    )
    const targetsById = new Map(
      liveTargets.map((target) => [target.snapshot().id, target] as const),
    )
    const hurtboxes = liveTargets.map((target) => target.snapshot().hurtbox)
    const candidates = [...request.query({ contactShape: shape, hurtboxes })].sort(
      (left, right) =>
        left.targetId.localeCompare(right.targetId) ||
        left.hurtboxId.localeCompare(right.hurtboxId),
    )
    const events: CombatHitEvent[] = []

    for (const candidate of candidates) {
      if (this.hitTargets.has(candidate.targetId)) {
        continue
      }
      const target = targetsById.get(candidate.targetId)
      if (
        target === undefined ||
        target.snapshot().hurtbox.id !== candidate.hurtboxId
      ) {
        continue
      }

      const damage = target.applyDamage(action.damage)
      if (!damage.applied) {
        continue
      }
      const event: CombatHitEvent = Object.freeze({
        type: 'combat-hit',
        attackerId: 'player',
        targetId: candidate.targetId,
        actionId: action.action.id,
        executionId,
        contactWindowId: shape.windowId,
        contactPosition: Object.freeze({ ...shape.center }),
        simulationStep: request.simulationStep,
        damage: action.damage,
        appliedDamage: damage.appliedDamage,
      })
      this.hitTargets.add(candidate.targetId)
      this.totalHitCount += 1
      this.lastHit = event
      events.push(event)
    }

    return events
  }

  reset(): void {
    this.executionId = null
    this.hitTargets.clear()
    this.totalHitCount = 0
    this.lastHit = null
  }

  snapshot(): CombatContactSnapshot {
    if (this.totalHitCount === 0) {
      return EMPTY_CONTACT_SNAPSHOT
    }
    return { totalHitCount: this.totalHitCount, lastHit: this.lastHit }
  }

  private beginExecution(executionId: number): void {
    if (this.executionId === executionId) {
      return
    }
    this.executionId = executionId
    this.hitTargets.clear()
  }
}
