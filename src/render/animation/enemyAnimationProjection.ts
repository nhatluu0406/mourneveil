import type { CombatContactSnapshot } from '../../game/combat/combatContact'
import type { EnemyRuntimeSnapshot } from '../../game/enemies/enemyRuntime'
import { projectAnimationPresentation, type AnimationPresentationState } from './animationPresentation'

const PRESENTATION_HIT_FLASH_STEPS = 10

export function projectEnemyAnimation(
  enemy: EnemyRuntimeSnapshot,
  simulationStep: number,
  playerContact: CombatContactSnapshot,
): AnimationPresentationState {
  const simulationReaction =
    enemy.state === 'hitReaction'
      ? `sim-hit-reaction:${enemy.id}:${enemy.hitReactionRemainingSteps}`
      : null
  return projectAnimationPresentation({
    actorId: enemy.id,
    alive: enemy.alive,
    velocity: enemy.velocity,
    facing: enemy.facing,
    committedFacing: enemy.attackExecutionFacing,
    combat: enemy.action,
    committedMode: enemy.action.phase === 'idle' || enemy.state === 'hitReaction' ? null : 'enemy-attack',
    guarding: false,
    hitReactionToken:
      simulationReaction ??
      enemyHitReactionToken(enemy.id, simulationStep, playerContact),
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
    simulationStep - hit.simulationStep >= PRESENTATION_HIT_FLASH_STEPS
  ) {
    return null
  }
  return `${hit.attackerId}:${hit.executionId}:${hit.simulationStep}`
}
