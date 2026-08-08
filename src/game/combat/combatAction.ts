export type CombatActionId = string
export type CombatContactWindowId = string

export type CombatActionPhase = 'startup' | 'active' | 'recovery'

export type CombatActionWindowPolicy =
  | 'never'
  | 'recovery-only'
  | 'active-and-recovery'
  | 'always'

export interface CombatResourceCost {
  readonly resourceId: string
  readonly amount: number
}

export interface CombatActionDefinition {
  readonly id: CombatActionId
  readonly startupSteps: number
  readonly activeSteps: number
  readonly recoverySteps: number
  readonly resourceCost: CombatResourceCost | null
  readonly cancellationPolicy: CombatActionWindowPolicy
  readonly interruptibilityPolicy: CombatActionWindowPolicy
  readonly contactWindowId: CombatContactWindowId | null
  readonly cooldownSteps: number
}

export interface StartCombatActionRequest {
  readonly type: 'start-action'
  readonly actionId: CombatActionId
}

export type CombatActionRequest = StartCombatActionRequest

export interface CombatResourceValidationRequest {
  readonly actionId: CombatActionId
  readonly cost: CombatResourceCost
}

export type CombatResourceValidationResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string }

export type CombatResourceValidator = (
  request: CombatResourceValidationRequest,
) => CombatResourceValidationResult

export const allowCombatResourceCost: CombatResourceValidator = () => ({
  allowed: true,
})

export function defineCombatAction(
  definition: CombatActionDefinition,
): CombatActionDefinition {
  assertNonEmpty(definition.id, 'Action id')
  assertPositiveStepCount(definition.startupSteps, 'Startup steps')
  assertPositiveStepCount(definition.activeSteps, 'Active steps')
  assertPositiveStepCount(definition.recoverySteps, 'Recovery steps')
  assertNonNegativeStepCount(definition.cooldownSteps, 'Cooldown steps')

  if (definition.contactWindowId !== null) {
    assertNonEmpty(definition.contactWindowId, 'Contact window id')
  }

  if (definition.resourceCost !== null) {
    assertNonEmpty(definition.resourceCost.resourceId, 'Resource id')
    if (
      !Number.isFinite(definition.resourceCost.amount) ||
      definition.resourceCost.amount <= 0
    ) {
      throw new RangeError('Resource cost amount must be a finite positive number')
    }
  }

  return Object.freeze({
    ...definition,
    resourceCost:
      definition.resourceCost === null
        ? null
        : Object.freeze({ ...definition.resourceCost }),
  })
}

export function windowPolicyAllowsPhase(
  policy: CombatActionWindowPolicy,
  phase: CombatActionPhase,
): boolean {
  switch (policy) {
    case 'never':
      return false
    case 'recovery-only':
      return phase === 'recovery'
    case 'active-and-recovery':
      return phase === 'active' || phase === 'recovery'
    case 'always':
      return true
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new TypeError(`${label} must not be empty`)
  }
}

function assertPositiveStepCount(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer`)
  }
}

function assertNonNegativeStepCount(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`)
  }
}
