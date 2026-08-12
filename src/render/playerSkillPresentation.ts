import type { CombatActionPhase } from '../game/combat/combatAction'
import {
  SKILL_OATH_CLEAVE_ID,
  SKILL_VEIL_STEP_ID,
  SKILL_WARD_PULSE_ID,
  type SkillId,
} from '../game/skills/skillDefinition'

export type PlayerSkillMotif = 'veil-fracture' | 'oath-arc' | 'ward-facets'

export interface PlayerSkillPresentation {
  readonly visible: boolean
  readonly skillId: SkillId | null
  readonly motif: PlayerSkillMotif | null
  readonly phase: CombatActionPhase | 'idle'
  readonly progress: number
  readonly intensity: number
}

interface PlayerSkillPresentationSource {
  readonly actionId: string | null
  readonly phase: CombatActionPhase | 'idle'
  readonly normalizedPhaseProgress: number
}

/** Pure projection only: the authoritative combat action owns every phase and duration. */
export function resolvePlayerSkillPresentation(
  source: PlayerSkillPresentationSource,
): PlayerSkillPresentation {
  const skillId = isPresentedSkill(source.actionId) ? source.actionId : null
  const visible = skillId !== null && source.phase !== 'idle'
  const progress = Math.max(0, Math.min(1, source.normalizedPhaseProgress))
  const intensity = !visible
    ? 0
    : source.phase === 'startup'
      ? 0.25 + progress * 0.75
      : source.phase === 'active'
        ? 1
        : 1 - progress * 0.82

  return {
    visible,
    skillId,
    motif:
      skillId === SKILL_VEIL_STEP_ID
        ? 'veil-fracture'
        : skillId === SKILL_OATH_CLEAVE_ID
          ? 'oath-arc'
          : skillId === SKILL_WARD_PULSE_ID
            ? 'ward-facets'
            : null,
    phase: source.phase,
    progress,
    intensity,
  }
}

function isPresentedSkill(actionId: string | null): actionId is SkillId {
  return actionId === SKILL_VEIL_STEP_ID || actionId === SKILL_OATH_CLEAVE_ID || actionId === SKILL_WARD_PULSE_ID
}
