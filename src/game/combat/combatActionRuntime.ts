import {
  allowCombatResourceCost,
  defineCombatAction,
  windowPolicyAllowsPhase,
  type CombatActionDefinition,
  type CombatActionId,
  type CombatActionPhase,
  type CombatActionRequest,
  type CombatContactWindowId,
  type CombatResourceValidator,
} from './combatAction'

export type CombatActionStartFailureReason =
  | 'unknown-action'
  | 'action-in-progress'
  | 'cooldown-active'
  | 'resource-unavailable'

export type CombatActionStartResult =
  | { readonly accepted: true; readonly actionId: CombatActionId }
  | {
      readonly accepted: false
      readonly actionId: CombatActionId
      readonly reason: CombatActionStartFailureReason
      readonly detail?: string
    }

export type CombatActionEndResult =
  | { readonly accepted: true; readonly actionId: CombatActionId }
  | { readonly accepted: false; readonly reason: 'idle' | 'policy-blocked' }

export interface CombatContactState {
  readonly enabled: boolean
  readonly actionId: CombatActionId | null
  readonly windowId: CombatContactWindowId | null
}

export interface CombatActionSnapshot {
  readonly actionId: CombatActionId | null
  readonly phase: CombatActionPhase | 'idle'
  readonly phaseElapsedSteps: number
  readonly phaseRemainingSteps: number
  readonly phaseDurationSteps: number
  readonly totalElapsedSteps: number
  readonly contact: CombatContactState
}

interface ActiveActionState {
  readonly definition: CombatActionDefinition
  phase: CombatActionPhase
  phaseElapsedSteps: number
  totalElapsedSteps: number
}

const IDLE_SNAPSHOT: CombatActionSnapshot = Object.freeze({
  actionId: null,
  phase: 'idle',
  phaseElapsedSteps: 0,
  phaseRemainingSteps: 0,
  phaseDurationSteps: 0,
  totalElapsedSteps: 0,
  contact: Object.freeze({ enabled: false, actionId: null, windowId: null }),
})

export class CombatActionRuntime {
  private readonly definitions = new Map<CombatActionId, CombatActionDefinition>()
  private readonly cooldowns = new Map<CombatActionId, number>()
  private activeAction: ActiveActionState | null = null

  constructor(definitions: readonly CombatActionDefinition[]) {
    for (const sourceDefinition of definitions) {
      const definition = defineCombatAction(sourceDefinition)
      if (this.definitions.has(definition.id)) {
        throw new Error(`Duplicate combat action id: ${definition.id}`)
      }
      this.definitions.set(definition.id, definition)
    }
  }

  request(
    request: CombatActionRequest,
    validateResources: CombatResourceValidator = allowCombatResourceCost,
  ): CombatActionStartResult {
    const definition = this.definitions.get(request.actionId)
    if (definition === undefined) {
      return rejectedStart(request.actionId, 'unknown-action')
    }
    if (this.activeAction !== null) {
      return rejectedStart(request.actionId, 'action-in-progress')
    }
    if ((this.cooldowns.get(request.actionId) ?? 0) > 0) {
      return rejectedStart(request.actionId, 'cooldown-active')
    }
    if (definition.resourceCost !== null) {
      const validation = validateResources({
        actionId: definition.id,
        cost: definition.resourceCost,
      })
      if (!validation.allowed) {
        return {
          accepted: false,
          actionId: request.actionId,
          reason: 'resource-unavailable',
          detail: validation.reason,
        }
      }
    }

    this.activeAction = {
      definition,
      phase: 'startup',
      phaseElapsedSteps: 0,
      totalElapsedSteps: 0,
    }
    return { accepted: true, actionId: definition.id }
  }

  advanceFixedStep(): void {
    this.advanceCooldowns()
    const action = this.activeAction
    if (action === null) {
      return
    }

    action.phaseElapsedSteps += 1
    action.totalElapsedSteps += 1
    if (action.phaseElapsedSteps < phaseDuration(action)) {
      return
    }

    switch (action.phase) {
      case 'startup':
        this.enterPhase(action, 'active')
        break
      case 'active':
        this.enterPhase(action, 'recovery')
        break
      case 'recovery':
        this.completeAction(action)
        break
    }
  }

  requestCancellation(): CombatActionEndResult {
    return this.endByPolicy('cancellationPolicy')
  }

  requestInterruption(): CombatActionEndResult {
    return this.endByPolicy('interruptibilityPolicy')
  }

  reset(): void {
    this.activeAction = null
    this.cooldowns.clear()
  }

  snapshot(): CombatActionSnapshot {
    const action = this.activeAction
    if (action === null) {
      return IDLE_SNAPSHOT
    }

    const duration = phaseDuration(action)
    const contactEnabled =
      action.phase === 'active' && action.definition.contactWindowId !== null
    return {
      actionId: action.definition.id,
      phase: action.phase,
      phaseElapsedSteps: action.phaseElapsedSteps,
      phaseRemainingSteps: duration - action.phaseElapsedSteps,
      phaseDurationSteps: duration,
      totalElapsedSteps: action.totalElapsedSteps,
      contact: contactEnabled
        ? {
            enabled: true,
            actionId: action.definition.id,
            windowId: action.definition.contactWindowId,
          }
        : { enabled: false, actionId: null, windowId: null },
    }
  }

  private enterPhase(action: ActiveActionState, phase: CombatActionPhase): void {
    action.phase = phase
    action.phaseElapsedSteps = 0
  }

  private completeAction(action: ActiveActionState): void {
    if (action.definition.cooldownSteps > 0) {
      this.cooldowns.set(action.definition.id, action.definition.cooldownSteps)
    }
    this.activeAction = null
  }

  private endByPolicy(
    policyName: 'cancellationPolicy' | 'interruptibilityPolicy',
  ): CombatActionEndResult {
    const action = this.activeAction
    if (action === null) {
      return { accepted: false, reason: 'idle' }
    }
    if (!windowPolicyAllowsPhase(action.definition[policyName], action.phase)) {
      return { accepted: false, reason: 'policy-blocked' }
    }

    const actionId = action.definition.id
    this.activeAction = null
    return { accepted: true, actionId }
  }

  private advanceCooldowns(): void {
    for (const [actionId, remainingSteps] of this.cooldowns) {
      if (remainingSteps <= 1) {
        this.cooldowns.delete(actionId)
      } else {
        this.cooldowns.set(actionId, remainingSteps - 1)
      }
    }
  }
}

function phaseDuration(action: ActiveActionState): number {
  switch (action.phase) {
    case 'startup':
      return action.definition.startupSteps
    case 'active':
      return action.definition.activeSteps
    case 'recovery':
      return action.definition.recoverySteps
  }
}

function rejectedStart(
  actionId: CombatActionId,
  reason: CombatActionStartFailureReason,
): CombatActionStartResult {
  return { accepted: false, actionId, reason }
}
