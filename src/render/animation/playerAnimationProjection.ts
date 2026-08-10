import { PLAYER_FLASK_ACTION_ID } from '../../game/character/playerFlask'
import { PLAYER_DODGE_ACTION_ID } from '../../game/combat/playerDefense'
import {
  PLAYER_HEAVY_ATTACK_ID,
  PLAYER_LIGHT_ATTACK_ID,
} from '../../game/combat/playerAttackActions'
import type { GameRuntimeSnapshot } from '../../game/runtime/GameRuntime'
import {
  projectAnimationPresentation,
  type CommittedAnimationMode,
  type AnimationPresentationState,
} from './animationPresentation'

const PLAYER_ACTOR_ID = 'player'
const HIT_REACTION_STEPS = 12

type PlayerAnimationSource = Pick<
  GameRuntimeSnapshot,
  'simulation' | 'player' | 'combat' | 'attack' | 'defense' | 'playerHealth' | 'incomingContact'
>

export function projectPlayerAnimation(
  snapshot: PlayerAnimationSource,
): AnimationPresentationState {
  return projectAnimationPresentation({
    actorId: PLAYER_ACTOR_ID,
    alive: snapshot.playerHealth.health.alive,
    velocity: snapshot.player.velocity,
    facing: snapshot.player.facing,
    committedFacing:
      snapshot.combat.actionId === PLAYER_DODGE_ACTION_ID
        ? snapshot.defense.dodgeDirection
        : snapshot.attack.executionFacing,
    combat: snapshot.combat,
    committedMode: playerCommittedMode(snapshot.combat.actionId),
    guarding: snapshot.defense.guarding,
    hitReactionToken: playerHitReactionToken(snapshot),
  })
}

function playerCommittedMode(actionId: string | null): CommittedAnimationMode | null {
  switch (actionId) {
    case PLAYER_LIGHT_ATTACK_ID:
      return 'light-attack'
    case PLAYER_HEAVY_ATTACK_ID:
      return 'heavy-attack'
    case PLAYER_DODGE_ACTION_ID:
      return 'dodge'
    case PLAYER_FLASK_ACTION_ID:
      return 'heal'
    default:
      return null
  }
}

function playerHitReactionToken(snapshot: PlayerAnimationSource): string | null {
  const hit = snapshot.incomingContact.lastHit
  if (
    hit === null ||
    hit.outcome !== 'damaged' ||
    snapshot.simulation.stepCount - hit.simulationStep >= HIT_REACTION_STEPS
  ) {
    return null
  }
  return `${hit.attackerId}:${hit.executionId}:${hit.simulationStep}`
}
