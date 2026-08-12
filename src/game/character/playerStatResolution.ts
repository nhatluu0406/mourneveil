import { PLAYER_MAXIMUM_HEALTH } from './playerHealth'
import { PLAYER_GUARD_IMPACT_THRESHOLD } from '../combat/playerDefense'
import {
  PLAYER_HEAVY_ATTACK,
  PLAYER_LIGHT_ATTACK,
} from '../combat/playerAttackActions'
import type { ItemGameplayModifiers } from '../items/itemDefinition'
import {
  PROGRESSION_ATTRIBUTE_IDS,
  PROGRESSION_STAT_EFFECTS,
  type ProgressionAllocation,
  type ProgressionAttributeId,
} from './playerProgression'

export interface ResolvedPlayerCombatStats {
  /** Full authoritative max HP after base + progression + equipment. */
  readonly maximumHealth: number
  /** Additive max-HP above base (progression + equipment). */
  readonly maximumHealthBonus: number
  readonly guardImpactThreshold: number
  readonly lightDamage: number
  readonly heavyDamage: number
  readonly lightDamageBonus: number
  readonly heavyDamageBonus: number
  readonly guardImpactThresholdBonus: number
  readonly progression: {
    readonly vitalityPoints: number
    readonly resolvePoints: number
    readonly mightPoints: number
    readonly maxHealthFromProgression: number
    readonly guardFromProgression: number
    readonly lightDamageFromProgression: number
    readonly heavyDamageFromProgression: number
  }
  readonly equipment: ItemGameplayModifiers
}

/**
 * Single authoritative combat-stat resolution:
 * base character + progression allocation + equipment modifiers.
 */
export function resolvePlayerCombatStats(
  allocation: ProgressionAllocation,
  equipment: ItemGameplayModifiers,
): ResolvedPlayerCombatStats {
  for (const id of PROGRESSION_ATTRIBUTE_IDS) {
    assertNonNegativeInteger(allocation[id], id)
  }

  const vitalityPoints = allocation.vitality
  const resolvePoints = allocation.resolve
  const mightPoints = allocation.might

  const maxHealthFromProgression =
    vitalityPoints * PROGRESSION_STAT_EFFECTS.vitality.maxHealthPerPoint
  const guardFromProgression =
    resolvePoints * PROGRESSION_STAT_EFFECTS.resolve.guardThresholdPerPoint
  const lightDamageFromProgression =
    mightPoints * PROGRESSION_STAT_EFFECTS.might.lightDamagePerPoint
  const heavyDamageFromProgression =
    mightPoints * PROGRESSION_STAT_EFFECTS.might.heavyDamagePerPoint

  const maximumHealthBonus = maxHealthFromProgression + equipment.maxHealthBonus
  const lightDamageBonus = lightDamageFromProgression + equipment.lightDamageBonus
  const heavyDamageBonus = heavyDamageFromProgression + equipment.heavyDamageBonus
  const guardImpactThresholdBonus =
    guardFromProgression + equipment.guardImpactThresholdBonus

  return {
    maximumHealth: PLAYER_MAXIMUM_HEALTH + maximumHealthBonus,
    maximumHealthBonus,
    guardImpactThreshold: PLAYER_GUARD_IMPACT_THRESHOLD + guardImpactThresholdBonus,
    lightDamage: PLAYER_LIGHT_ATTACK.damage + lightDamageBonus,
    heavyDamage: PLAYER_HEAVY_ATTACK.damage + heavyDamageBonus,
    lightDamageBonus,
    heavyDamageBonus,
    guardImpactThresholdBonus,
    progression: {
      vitalityPoints,
      resolvePoints,
      mightPoints,
      maxHealthFromProgression,
      guardFromProgression,
      lightDamageFromProgression,
      heavyDamageFromProgression,
    },
    equipment: { ...equipment },
  }
}

export function progressionBonusForAttribute(
  attribute: ProgressionAttributeId,
  points: number,
): { readonly maxHealth: number; readonly guard: number; readonly light: number; readonly heavy: number } {
  assertNonNegativeInteger(points, attribute)
  if (attribute === 'vitality') {
    return {
      maxHealth: points * PROGRESSION_STAT_EFFECTS.vitality.maxHealthPerPoint,
      guard: 0,
      light: 0,
      heavy: 0,
    }
  }
  if (attribute === 'resolve') {
    return {
      maxHealth: 0,
      guard: points * PROGRESSION_STAT_EFFECTS.resolve.guardThresholdPerPoint,
      light: 0,
      heavy: 0,
    }
  }
  return {
    maxHealth: 0,
    guard: 0,
    light: points * PROGRESSION_STAT_EFFECTS.might.lightDamagePerPoint,
    heavy: points * PROGRESSION_STAT_EFFECTS.might.heavyDamagePerPoint,
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`)
  }
}
