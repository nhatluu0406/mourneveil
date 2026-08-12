export interface PlayerSkillUseRequest {
  readonly type: 'player-skill-use'
}

export const PLAYER_SKILL_USE_REQUEST: PlayerSkillUseRequest = Object.freeze({
  type: 'player-skill-use' as const,
})

export function createPlayerSkillUseRequest(): PlayerSkillUseRequest {
  return PLAYER_SKILL_USE_REQUEST
}
