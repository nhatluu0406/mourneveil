export interface PlayerDodgeRequest {
  readonly type: 'player-dodge'
}

export const PLAYER_DODGE_REQUEST: PlayerDodgeRequest = Object.freeze({
  type: 'player-dodge',
})

export interface PlayerDefenseIntent {
  readonly guardHeld: boolean
}

export const NEUTRAL_PLAYER_DEFENSE_INTENT: PlayerDefenseIntent = Object.freeze({
  guardHeld: false,
})
