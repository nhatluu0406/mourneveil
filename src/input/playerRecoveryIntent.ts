export const PLAYER_CHECKPOINT_INTERACTION_REQUEST = Object.freeze({
  type: 'player-checkpoint-interaction' as const,
})
export type PlayerCheckpointInteractionRequest =
  typeof PLAYER_CHECKPOINT_INTERACTION_REQUEST

export const PLAYER_WORLD_INTERACTION_REQUEST = Object.freeze({
  type: 'player-world-interaction' as const,
})
export type PlayerWorldInteractionRequest = typeof PLAYER_WORLD_INTERACTION_REQUEST

export const PLAYER_RESPAWN_REQUEST = Object.freeze({
  type: 'player-respawn' as const,
})
export type PlayerRespawnRequest = typeof PLAYER_RESPAWN_REQUEST
