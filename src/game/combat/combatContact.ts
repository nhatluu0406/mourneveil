import type { Vector3Value } from '../character/playerMotor'
import type { CombatActionId, CombatContactWindowId } from './combatAction'
import type { CombatActionSnapshot } from './combatActionRuntime'
import {
  playerAttackForActionId,
  type PlayerAttackSpatialSnapshot,
} from './playerAttackActions'
import { getSkillDefinition } from '../skills/skillDefinition'
import type {
  CombatHurtboxId,
  CombatTargetId,
  DamageableCombatTarget,
  SphereHurtbox,
} from './combatTarget'
import type { CombatDamageResult } from './combatHealth'

export interface ActiveCombatContactShape {
  readonly id: string
  readonly kind: 'sphere'
  readonly actionId: CombatActionId
  readonly windowId: CombatContactWindowId
  readonly center: Vector3Value
  readonly radius: number
}

export interface CombatContactCandidate {
  readonly hurtboxId: CombatHurtboxId
  readonly targetId: CombatTargetId
}

export interface CombatContactQueryRequest {
  readonly contactShape: ActiveCombatContactShape
  readonly hurtboxes: readonly SphereHurtbox[]
}

export type CombatContactQuery = (
  request: CombatContactQueryRequest,
) => readonly CombatContactCandidate[]

export type CombatOcclusionResult = 'clear' | 'blocked'

export interface CombatOcclusionQueryRequest {
  readonly origin: Vector3Value
  readonly target: Vector3Value
}

export type CombatOcclusionQuery = (
  request: CombatOcclusionQueryRequest,
) => CombatOcclusionResult

export interface CombatHitEvent {
  readonly type: 'combat-hit'
  readonly attackerId: CombatTargetId
  readonly targetId: CombatTargetId
  readonly actionId: CombatActionId
  readonly executionId: number
  readonly contactWindowId: CombatContactWindowId
  readonly contactPosition: Vector3Value
  readonly simulationStep: number
  readonly damage: number
  readonly appliedDamage: number
  readonly outcome: 'damaged' | 'dodged' | 'guarded' | 'guard-broken'
}

export interface CombatContactSnapshot {
  readonly totalHitCount: number
  readonly lastHit: CombatHitEvent | null
}

export interface ResolvePlayerContactRequest {
  readonly combat: CombatActionSnapshot
  readonly attack: PlayerAttackSpatialSnapshot
  readonly simulationStep: number
  readonly targets: readonly DamageableCombatTarget[]
  readonly query: CombatContactQuery
  /** When set, overrides authored attack definition damage (equipment modifiers). */
  readonly damageOverride?: number
  readonly attackOrigin?: Vector3Value
  readonly occlusionQuery?: CombatOcclusionQuery
}

export interface CombatDamageResolution {
  readonly outcome: CombatHitEvent['outcome']
  readonly result: CombatDamageResult
}

export type CombatDamageResolver = (
  target: DamageableCombatTarget,
  damage: number,
) => CombatDamageResolution

export interface ResolveCombatContactRequest {
  readonly attackerId: CombatTargetId
  readonly combat: CombatActionSnapshot
  readonly contactShape: ActiveCombatContactShape | null
  readonly simulationStep: number
  readonly targets: readonly DamageableCombatTarget[]
  readonly query: CombatContactQuery
  readonly damage: number
  readonly resolveDamage?: CombatDamageResolver
  /** Authoritative attacker origin for solid-world occlusion (not render). */
  readonly attackOrigin?: Vector3Value
  /** When provided, overlap candidates require a clear solid-world path. */
  readonly occlusionQuery?: CombatOcclusionQuery
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
    const attack = playerAttackForActionId(request.combat.actionId)
    const skill =
      request.combat.actionId === null ? null : getSkillDefinition(request.combat.actionId)
    const skillMelee = skill?.effect.kind === 'empowered-melee' ? skill.effect : null
    if (attack === null && skillMelee === null) return []
    const authoredDamage = attack?.damage ?? 0
    return this.resolveContact({
      attackerId: 'player',
      combat: request.combat,
      contactShape: shape,
      simulationStep: request.simulationStep,
      targets: request.targets,
      query: request.query,
      damage: request.damageOverride ?? authoredDamage,
      attackOrigin: request.attackOrigin,
      occlusionQuery: request.occlusionQuery,
    })
  }

  resolveContact(request: ResolveCombatContactRequest): readonly CombatHitEvent[] {
    const shape = request.contactShape
    const executionId = request.combat.executionId
    if (
      !request.combat.contact.enabled ||
      shape === null ||
      executionId === null ||
      request.combat.actionId !== shape.actionId ||
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

      const hurtbox = target.snapshot().hurtbox
      if (request.occlusionQuery !== undefined) {
        const origin = request.attackOrigin ?? shape.center
        if (
          request.occlusionQuery({
            origin,
            target: hurtbox.center,
          }) === 'blocked'
        ) {
          continue
        }
      }

      const resolution = request.resolveDamage?.(target, request.damage) ?? {
        outcome: 'damaged' as const,
        result: target.applyDamage(request.damage),
      }
      if (!resolution.result.applied && resolution.outcome === 'damaged') {
        continue
      }
      const event: CombatHitEvent = Object.freeze({
        type: 'combat-hit',
        attackerId: request.attackerId,
        targetId: candidate.targetId,
        actionId: shape.actionId,
        executionId,
        contactWindowId: shape.windowId,
        contactPosition: Object.freeze({ ...shape.center }),
        simulationStep: request.simulationStep,
        damage: request.damage,
        appliedDamage: resolution.result.appliedDamage,
        outcome: resolution.outcome,
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
