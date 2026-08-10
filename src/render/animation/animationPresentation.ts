import type { CombatActionPhase } from '../../game/combat/combatAction'
import type { CombatActionSnapshot } from '../../game/combat/combatActionRuntime'
import type { PlayerFacingDirection, Vector3Value } from '../../game/character/playerMotor'

export type ActorAnimationMode =
  | 'idle'
  | 'locomotion'
  | 'light-attack'
  | 'heavy-attack'
  | 'enemy-attack'
  | 'guard'
  | 'dodge'
  | 'heal'
  | 'hit-reaction'
  | 'defeated'

export type CommittedAnimationMode =
  | 'light-attack'
  | 'heavy-attack'
  | 'enemy-attack'
  | 'dodge'
  | 'heal'

export interface AnimationActionPresentation {
  readonly actionId: string
  readonly executionId: number
  readonly phase: CombatActionPhase
  readonly normalizedPhaseProgress: number
}

export interface AnimationTransitionPresentation {
  readonly blendSeconds: number
  readonly defeatedOverride: boolean
}

/**
 * Backend-neutral projection consumed by procedural poses now and GLTF clips later.
 * It contains no timer or callback capable of advancing gameplay authority.
 */
export interface AnimationPresentationState {
  readonly actorId: string
  readonly mode: ActorAnimationMode
  readonly locomotionSpeed: number
  readonly locomotionDirection: PlayerFacingDirection
  readonly facing: PlayerFacingDirection
  readonly action: AnimationActionPresentation | null
  readonly hitReactionToken: string | null
  readonly transition: AnimationTransitionPresentation
}

export interface AnimationProjectionInput {
  readonly actorId: string
  readonly alive: boolean
  readonly velocity: Vector3Value
  readonly facing: PlayerFacingDirection
  readonly committedFacing: PlayerFacingDirection | null
  readonly combat: CombatActionSnapshot
  readonly committedMode: CommittedAnimationMode | null
  readonly guarding: boolean
  readonly hitReactionToken: string | null
}

const MOVEMENT_EPSILON = 0.001

export function normalizedActionPhaseProgress(
  action: Pick<CombatActionSnapshot, 'phase' | 'phaseElapsedSteps' | 'phaseDurationSteps'>,
): number {
  if (action.phase === 'idle' || action.phaseDurationSteps <= 0) return 0
  return Math.min(1, Math.max(0, action.phaseElapsedSteps / action.phaseDurationSteps))
}

/** Explicit precedence: defeated > committed action > hit reaction > guard > locomotion > idle. */
export function projectAnimationPresentation(
  input: AnimationProjectionInput,
): AnimationPresentationState {
  const locomotionSpeed = Math.hypot(input.velocity.x, input.velocity.z)
  const moving = locomotionSpeed > MOVEMENT_EPSILON
  const action =
    input.combat.phase === 'idle' ||
    input.combat.actionId === null ||
    input.combat.executionId === null
      ? null
      : {
          actionId: input.combat.actionId,
          executionId: input.combat.executionId,
          phase: input.combat.phase,
          normalizedPhaseProgress: normalizedActionPhaseProgress(input.combat),
        }

  const mode: ActorAnimationMode = !input.alive
    ? 'defeated'
    : input.committedMode !== null && action !== null
      ? input.committedMode
      : input.hitReactionToken !== null
        ? 'hit-reaction'
        : input.guarding
          ? 'guard'
          : moving
            ? 'locomotion'
            : 'idle'

  return {
    actorId: input.actorId,
    mode,
    locomotionSpeed,
    locomotionDirection: moving
      ? normalizeHorizontal(input.velocity, input.facing)
      : { ...input.facing },
    facing: { ...(input.committedFacing ?? input.facing) },
    action,
    hitReactionToken: input.hitReactionToken,
    transition: {
      blendSeconds: transitionSecondsForMode(mode),
      defeatedOverride: mode === 'defeated',
    },
  }
}

function transitionSecondsForMode(mode: ActorAnimationMode): number {
  switch (mode) {
    case 'defeated':
    case 'hit-reaction':
      return 0.06
    case 'light-attack':
    case 'heavy-attack':
    case 'enemy-attack':
    case 'dodge':
      return 0.08
    case 'heal':
    case 'guard':
      return 0.12
    case 'locomotion':
    case 'idle':
      return 0.16
  }
}

function normalizeHorizontal(
  velocity: Vector3Value,
  fallback: PlayerFacingDirection,
): PlayerFacingDirection {
  const magnitude = Math.hypot(velocity.x, velocity.z)
  return magnitude <= MOVEMENT_EPSILON
    ? { ...fallback }
    : { x: velocity.x / magnitude, z: velocity.z / magnitude }
}
