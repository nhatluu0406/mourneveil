import type { PlayerAimDirection } from './playerAimIntent'

export type PlayerAttackKind = 'light' | 'heavy'

export interface PlayerAttackRequest {
  readonly type: 'player-attack'
  readonly attack: PlayerAttackKind
  readonly aimDirection: PlayerAimDirection
}

export function createPlayerAttackRequest(
  attack: PlayerAttackKind,
  aimDirection: PlayerAimDirection,
): PlayerAttackRequest {
  return Object.freeze({
    type: 'player-attack',
    attack,
    aimDirection: Object.freeze({ ...aimDirection }),
  })
}
