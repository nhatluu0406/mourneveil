export type PlayerAttackKind = 'light' | 'heavy'

export interface PlayerAttackRequest {
  readonly type: 'player-attack'
  readonly attack: PlayerAttackKind
}

export function createPlayerAttackRequest(
  attack: PlayerAttackKind,
): PlayerAttackRequest {
  return Object.freeze({ type: 'player-attack', attack })
}
