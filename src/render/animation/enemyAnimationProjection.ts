import type { CombatContactSnapshot } from '../../game/combat/combatContact'
import type { EnemyRuntimeSnapshot } from '../../game/enemies/enemyRuntime'
import { projectAnimationPresentation, type AnimationPresentationState } from './animationPresentation'

const HIT_REACTION_STEPS = 10

export function projectEnemyAnimation(
  enemy: EnemyRuntimeSnapshot,
  simulationStep: number,
  playerContact: CombatContactSnapshot,
): AnimationPresentationState {
  return projectAnimationPresentation({
    actorId: enemy.id,
    alive: enemy.alive,
    velocity: enemy.velocity,
    facing: enemy.facing,
    committedFacing: enemy.attackExecutionFacing,
    combat: enemy.action,
    committedMode: enemy.action.phase === 'idle' ? null : 'enemy-attack',
    guarding: false,
    hitReactionToken: enemyHitReactionToken(enemy.id, simulationStep, playerContact),
  })
}

function enemyHitReactionToken(
  enemyId: string,
  simulationStep: number,
  contact: CombatContactSnapshot,
): string | null {
  const hit = contact.lastHit
  if (
    hit === null ||
    hit.targetId !== enemyId ||
    hit.outcome !== 'damaged' ||
    simulationStep - hit.simulationStep >= HIT_REACTION_STEPS
  ) {
    return null
  }
  return `${hit.attackerId}:${hit.executionId}:${hit.simulationStep}`
}
