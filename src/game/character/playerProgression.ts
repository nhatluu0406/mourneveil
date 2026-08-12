/**
 * Durable player progression (XP / level / attribute points).
 * Combat reads resolved stats via `resolvePlayerCombatStats` — not this module alone.
 */

export const PLAYER_MIN_LEVEL = 1
export const PLAYER_MAX_LEVEL = 5

export type ProgressionAttributeId = 'vitality' | 'resolve' | 'might'

export const PROGRESSION_ATTRIBUTE_IDS = Object.freeze([
  'vitality',
  'resolve',
  'might',
] as const satisfies readonly ProgressionAttributeId[])

/** Cumulative XP required to *be* at each level (index === level). */
export const PLAYER_LEVEL_CUMULATIVE_XP: readonly number[] = Object.freeze([
  0, // unused (level 0)
  0, // level 1
  50, // level 2
  120, // level 3
  220, // level 4
  350, // level 5
])

export const PROGRESSION_STAT_EFFECTS = Object.freeze({
  vitality: Object.freeze({ maxHealthPerPoint: 10 }),
  resolve: Object.freeze({ guardThresholdPerPoint: 1 }),
  might: Object.freeze({ lightDamagePerPoint: 2, heavyDamagePerPoint: 3 }),
})

export interface ProgressionAllocation {
  readonly vitality: number
  readonly resolve: number
  readonly might: number
}

export const ZERO_PROGRESSION_ALLOCATION: ProgressionAllocation = Object.freeze({
  vitality: 0,
  resolve: 0,
  might: 0,
})

export interface ProgressionDurableState {
  readonly level: number
  readonly experience: number
  readonly unspentPoints: number
  readonly allocation: ProgressionAllocation
}

export interface ProgressionSnapshot extends ProgressionDurableState {
  readonly experienceIntoLevel: number
  readonly experienceToNextLevel: number | null
  readonly totalSpentPoints: number
  readonly atMaxLevel: boolean
}

export type GrantExperienceResult = {
  readonly applied: boolean
  readonly experienceGained: number
  readonly levelsGained: number
  readonly pointsGained: number
  readonly state: ProgressionDurableState
}

export type AllocateProgressionResult =
  | {
      readonly accepted: true
      readonly attribute: ProgressionAttributeId
      readonly state: ProgressionDurableState
    }
  | {
      readonly accepted: false
      readonly reason: 'no-unspent-points' | 'unknown-attribute' | 'at-soft-cap'
    }

/** Soft cap per attribute within the M13 MB1 level band (levels 1–5 → 4 points total). */
export const PROGRESSION_ATTRIBUTE_SOFT_CAP = PLAYER_MAX_LEVEL - PLAYER_MIN_LEVEL

export function createDefaultProgressionState(): ProgressionDurableState {
  return {
    level: PLAYER_MIN_LEVEL,
    experience: 0,
    unspentPoints: 0,
    allocation: { ...ZERO_PROGRESSION_ALLOCATION },
  }
}

export function totalSpentPoints(allocation: ProgressionAllocation): number {
  return allocation.vitality + allocation.resolve + allocation.might
}

export function levelForExperience(experience: number): number {
  assertNonNegativeInteger(experience, 'Experience')
  let level = PLAYER_MIN_LEVEL
  for (let candidate = PLAYER_MIN_LEVEL + 1; candidate <= PLAYER_MAX_LEVEL; candidate += 1) {
    const required = PLAYER_LEVEL_CUMULATIVE_XP[candidate]
    if (required === undefined || experience < required) break
    level = candidate
  }
  return level
}

export function experienceIntoLevel(level: number, experience: number): number {
  assertLevel(level)
  assertNonNegativeInteger(experience, 'Experience')
  const floor = PLAYER_LEVEL_CUMULATIVE_XP[level] ?? 0
  return Math.max(0, experience - floor)
}

export function experienceToNextLevel(level: number, experience: number): number | null {
  assertLevel(level)
  if (level >= PLAYER_MAX_LEVEL) return null
  const next = PLAYER_LEVEL_CUMULATIVE_XP[level + 1]
  if (next === undefined) return null
  return Math.max(0, next - experience)
}

export function projectProgressionSnapshot(state: ProgressionDurableState): ProgressionSnapshot {
  validateDurableState(state)
  return {
    ...state,
    allocation: { ...state.allocation },
    experienceIntoLevel: experienceIntoLevel(state.level, state.experience),
    experienceToNextLevel: experienceToNextLevel(state.level, state.experience),
    totalSpentPoints: totalSpentPoints(state.allocation),
    atMaxLevel: state.level >= PLAYER_MAX_LEVEL,
  }
}

export function grantExperience(
  state: ProgressionDurableState,
  amount: number,
): GrantExperienceResult {
  validateDurableState(state)
  assertNonNegativeInteger(amount, 'XP grant')
  if (amount === 0) {
    return {
      applied: false,
      experienceGained: 0,
      levelsGained: 0,
      pointsGained: 0,
      state,
    }
  }

  const experience = state.experience + amount
  const level = levelForExperience(experience)
  const levelsGained = level - state.level
  const pointsGained = levelsGained
  return {
    applied: true,
    experienceGained: amount,
    levelsGained,
    pointsGained,
    state: {
      level,
      experience,
      unspentPoints: state.unspentPoints + pointsGained,
      allocation: { ...state.allocation },
    },
  }
}

export function allocateProgressionPoint(
  state: ProgressionDurableState,
  attribute: string,
): AllocateProgressionResult {
  validateDurableState(state)
  if (!isProgressionAttributeId(attribute)) {
    return { accepted: false, reason: 'unknown-attribute' }
  }
  if (state.unspentPoints <= 0) {
    return { accepted: false, reason: 'no-unspent-points' }
  }
  if (state.allocation[attribute] >= PROGRESSION_ATTRIBUTE_SOFT_CAP) {
    return { accepted: false, reason: 'at-soft-cap' }
  }
  return {
    accepted: true,
    attribute,
    state: {
      level: state.level,
      experience: state.experience,
      unspentPoints: state.unspentPoints - 1,
      allocation: {
        ...state.allocation,
        [attribute]: state.allocation[attribute] + 1,
      },
    },
  }
}

export function restoreProgressionState(raw: ProgressionDurableState): ProgressionDurableState {
  const level = clampLevel(raw.level)
  const experience = Math.max(0, Math.floor(raw.experience))
  const derivedLevel = levelForExperience(experience)
  const levelFinal = Math.max(level, derivedLevel)
  const allocation = {
    vitality: nonNegativeInt(raw.allocation.vitality),
    resolve: nonNegativeInt(raw.allocation.resolve),
    might: nonNegativeInt(raw.allocation.might),
  }
  const spent = totalSpentPoints(allocation)
  const earnedPoints = levelFinal - PLAYER_MIN_LEVEL
  const unspentPoints = Math.max(0, earnedPoints - spent)
  // Prefer persisted unspent when consistent; otherwise recompute from level − spent.
  const persistedUnspent = nonNegativeInt(raw.unspentPoints)
  const reconciledUnspent =
    spent + persistedUnspent === earnedPoints ? persistedUnspent : unspentPoints
  return {
    level: levelFinal,
    experience,
    unspentPoints: reconciledUnspent,
    allocation,
  }
}

export function isProgressionAttributeId(value: string): value is ProgressionAttributeId {
  return (PROGRESSION_ATTRIBUTE_IDS as readonly string[]).includes(value)
}

export class PlayerProgressionRuntime {
  private state: ProgressionDurableState = createDefaultProgressionState()

  reset(): void {
    this.state = createDefaultProgressionState()
  }

  restore(raw: ProgressionDurableState): void {
    this.state = restoreProgressionState(raw)
  }

  grantExperience(amount: number): GrantExperienceResult {
    const result = grantExperience(this.state, amount)
    if (result.applied) this.state = result.state
    return result
  }

  allocate(attribute: string): AllocateProgressionResult {
    const result = allocateProgressionPoint(this.state, attribute)
    if (result.accepted) this.state = result.state
    return result
  }

  durable(): ProgressionDurableState {
    return {
      level: this.state.level,
      experience: this.state.experience,
      unspentPoints: this.state.unspentPoints,
      allocation: { ...this.state.allocation },
    }
  }

  snapshot(): ProgressionSnapshot {
    return projectProgressionSnapshot(this.state)
  }
}

function validateDurableState(state: ProgressionDurableState): void {
  assertLevel(state.level)
  assertNonNegativeInteger(state.experience, 'Experience')
  assertNonNegativeInteger(state.unspentPoints, 'Unspent points')
  for (const id of PROGRESSION_ATTRIBUTE_IDS) {
    assertNonNegativeInteger(state.allocation[id], id)
  }
}

function assertLevel(level: number): void {
  if (!Number.isInteger(level) || level < PLAYER_MIN_LEVEL || level > PLAYER_MAX_LEVEL) {
    throw new RangeError(`Level must be an integer in ${PLAYER_MIN_LEVEL}..${PLAYER_MAX_LEVEL}`)
  }
}

function clampLevel(level: number): number {
  if (!Number.isInteger(level)) return PLAYER_MIN_LEVEL
  return Math.min(PLAYER_MAX_LEVEL, Math.max(PLAYER_MIN_LEVEL, level))
}

function nonNegativeInt(value: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`)
  }
}
