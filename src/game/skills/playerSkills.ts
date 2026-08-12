import type { CombatActionSnapshot, CombatActionStartResult } from '../combat/combatActionRuntime'
import type { PlayerFacingDirection } from '../character/playerMotor'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import { movementIntentToFacing } from '../character/playerMotor'
import {
  DEFAULT_EQUIPPED_SKILL_ID,
  getSkillDefinition,
  isSkillId,
  skillUnlockedAtLevel,
  unlockedSkillIdsForLevel,
  type SkillDefinition,
  type SkillId,
} from './skillDefinition'

export type EquipSkillResult =
  | { readonly accepted: true; readonly skillId: SkillId }
  | {
      readonly accepted: false
      readonly reason: 'unknown-skill' | 'locked' | 'already-equipped' | 'combat-busy' | 'actor-defeated'
    }

export type SkillActivationRejectReason =
  | 'no-equipped-skill'
  | 'locked'
  | 'cooldown-active'
  | 'combat-busy'
  | 'guard-active'
  | 'actor-defeated'

export interface PlayerSkillSnapshot {
  readonly equippedSkillId: SkillId | null
  readonly unlockedSkillIds: readonly SkillId[]
  readonly cooldownRemainingSteps: number
  readonly cooldownDurationSteps: number
  readonly cooldownRatio: number
  readonly ready: boolean
  readonly activationSemantic: string | null
  readonly executionId: number | null
  readonly actionPhase: CombatActionSnapshot['phase']
  readonly repositionDirection: PlayerFacingDirection | null
  readonly repositionMovementActive: boolean
  readonly repositionSpeed: number
  readonly lastActivationToken: string | null
}

export interface SkillCooldownQuery {
  remainingSteps(actionId: string): number
}

/**
 * Loadout + transient skill presentation state.
 * Unlock is derived from level. Cooldown authority stays on CombatActionRuntime.
 */
export class PlayerSkillRuntime {
  private equippedSkillId: SkillId | null = DEFAULT_EQUIPPED_SKILL_ID
  private level = 1
  private reposition:
    | {
        readonly executionId: number
        readonly direction: PlayerFacingDirection
        readonly speed: number
      }
    | null = null
  private lastActivationToken: string | null = null
  private wardPulsePendingExecutionId: number | null = null
  private wardPulseAppliedExecutionId: number | null = null

  resetTransient(): void {
    this.reposition = null
    this.lastActivationToken = null
    this.wardPulsePendingExecutionId = null
    this.wardPulseAppliedExecutionId = null
  }

  /** Full runtime reset including loadout defaults (fresh session / development restore). */
  reset(): void {
    this.equippedSkillId = DEFAULT_EQUIPPED_SKILL_ID
    this.level = 1
    this.resetTransient()
  }

  syncLevel(level: number): void {
    this.level = level
    if (this.equippedSkillId !== null && !skillUnlockedAtLevel(this.equippedSkillId, level)) {
      this.equippedSkillId = DEFAULT_EQUIPPED_SKILL_ID
    }
  }

  restoreEquipped(skillId: string | null): void {
    if (skillId === null) {
      this.equippedSkillId = null
      return
    }
    if (!isSkillId(skillId) || !skillUnlockedAtLevel(skillId, this.level)) {
      this.equippedSkillId = DEFAULT_EQUIPPED_SKILL_ID
      return
    }
    this.equippedSkillId = skillId
  }

  durableEquippedSkillId(): SkillId | null {
    return this.equippedSkillId
  }

  equip(
    skillId: string,
    options: { readonly alive: boolean; readonly combatIdle: boolean },
  ): EquipSkillResult {
    if (!options.alive) return { accepted: false, reason: 'actor-defeated' }
    if (!options.combatIdle) return { accepted: false, reason: 'combat-busy' }
    if (!isSkillId(skillId)) return { accepted: false, reason: 'unknown-skill' }
    if (!skillUnlockedAtLevel(skillId, this.level)) {
      return { accepted: false, reason: 'locked' }
    }
    if (this.equippedSkillId === skillId) {
      return { accepted: false, reason: 'already-equipped' }
    }
    this.equippedSkillId = skillId
    return { accepted: true, skillId }
  }

  sampleRepositionDirection(
    movementIntent: PlayerMovementIntent,
    fallbackFacing: PlayerFacingDirection,
  ): PlayerFacingDirection {
    return movementIntent.horizontal === 0 && movementIntent.forward === 0
      ? { ...fallbackFacing }
      : movementIntentToFacing(movementIntent)
  }

  acceptActivation(
    result: CombatActionStartResult,
    direction: PlayerFacingDirection | null,
  ): void {
    if (!result.accepted) return
    const definition = getSkillDefinition(result.actionId)
    if (definition === null) return
    this.lastActivationToken = `${definition.id}:${result.executionId}`
    if (definition.effect.kind === 'reposition' && direction !== null) {
      this.reposition = {
        executionId: result.executionId,
        direction: { ...direction },
        speed: definition.effect.speed,
      }
    } else {
      this.reposition = null
    }
    if (definition.effect.kind === 'guard-relief') {
      this.wardPulsePendingExecutionId = result.executionId
      this.wardPulseAppliedExecutionId = null
    } else {
      this.wardPulsePendingExecutionId = null
      this.wardPulseAppliedExecutionId = null
    }
  }

  /**
   * Returns true once when Ward Pulse reaches its authoritative active step.
   */
  consumeWardPulseApplication(combat: CombatActionSnapshot): boolean {
    if (
      this.wardPulsePendingExecutionId === null ||
      combat.actionId !== 'skill.ward-pulse' ||
      combat.executionId !== this.wardPulsePendingExecutionId ||
      combat.phase !== 'active' ||
      this.wardPulseAppliedExecutionId === combat.executionId
    ) {
      if (combat.phase === 'idle') {
        this.wardPulsePendingExecutionId = null
        this.wardPulseAppliedExecutionId = null
      }
      return false
    }
    this.wardPulseAppliedExecutionId = combat.executionId
    return true
  }

  advanceFixedStep(combat: CombatActionSnapshot): void {
    if (
      this.reposition !== null &&
      (combat.actionId !== 'skill.veil-step' ||
        combat.executionId !== this.reposition.executionId)
    ) {
      this.reposition = null
    }
  }

  activationGate(options: {
    readonly alive: boolean
    readonly combatIdle: boolean
    readonly canStartAction: boolean
    readonly cooldownRemaining: number
  }): { readonly allowed: true; readonly definition: SkillDefinition } | {
    readonly allowed: false
    readonly reason: SkillActivationRejectReason
    readonly actionId: string
  } {
    const equipped = this.equippedSkillId
    const actionId = equipped ?? 'skill.none'
    if (!options.alive) {
      return { allowed: false, reason: 'actor-defeated', actionId }
    }
    if (equipped === null) {
      return { allowed: false, reason: 'no-equipped-skill', actionId }
    }
    const definition = getSkillDefinition(equipped)
    if (definition === null || !skillUnlockedAtLevel(equipped, this.level)) {
      return { allowed: false, reason: 'locked', actionId }
    }
    if (!options.canStartAction) {
      return { allowed: false, reason: 'guard-active', actionId }
    }
    if (!options.combatIdle) {
      return { allowed: false, reason: 'combat-busy', actionId }
    }
    if (options.cooldownRemaining > 0) {
      return { allowed: false, reason: 'cooldown-active', actionId }
    }
    return { allowed: true, definition }
  }

  snapshot(
    combat: CombatActionSnapshot,
    cooldownQuery: SkillCooldownQuery,
  ): PlayerSkillSnapshot {
    const equipped = this.equippedSkillId
    const definition = equipped === null ? null : getSkillDefinition(equipped)
    const cooldownDurationSteps = definition?.action.cooldownSteps ?? 0
    const cooldownRemainingSteps =
      definition === null ? 0 : cooldownQuery.remainingSteps(definition.action.id)
    const activeSkill =
      definition !== null &&
      combat.actionId === definition.id &&
      combat.phase !== 'idle'
    const ready =
      definition !== null &&
      !activeSkill &&
      cooldownRemainingSteps === 0
    const cooldownRatio =
      activeSkill
        ? 1
        : cooldownDurationSteps <= 0
          ? 0
          : Math.min(1, Math.max(0, cooldownRemainingSteps / cooldownDurationSteps))
    const reposition =
      this.reposition !== null &&
      combat.actionId === 'skill.veil-step' &&
      combat.executionId === this.reposition.executionId
        ? this.reposition
        : null

    return {
      equippedSkillId: equipped,
      unlockedSkillIds: unlockedSkillIdsForLevel(this.level),
      cooldownRemainingSteps,
      cooldownDurationSteps,
      cooldownRatio,
      ready,
      activationSemantic: definition?.semanticPresentationId ?? null,
      executionId:
        activeSkill && combat.executionId !== null ? combat.executionId : null,
      actionPhase: activeSkill ? combat.phase : 'idle',
      repositionDirection: reposition === null ? null : { ...reposition.direction },
      repositionMovementActive: reposition !== null && combat.phase === 'active',
      repositionSpeed: reposition?.speed ?? 0,
      lastActivationToken: this.lastActivationToken,
    }
  }
}
