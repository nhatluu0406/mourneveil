import type { CombatActionSnapshot } from '../game/combat/combatActionRuntime'
import type { PlayerFacingDirection } from '../game/character/playerMotor'
import {
  playerAttackForActionId,
  type PlayerAttackSpatialSnapshot,
} from '../game/combat/playerAttackActions'
import type { PlayerMotorState } from '../game/character/playerMotor'

export interface PlayerAttackPresentationPose {
  readonly weaponVisible: boolean
  readonly weaponYawRadians: number
  readonly weaponForwardOffset: number
  readonly color: string
}

const IDLE_POSE: PlayerAttackPresentationPose = Object.freeze({
  weaponVisible: true,
  weaponYawRadians: 0,
  weaponForwardOffset: -0.62,
  color: '#c4a574',
})

/** Presentation and contact must share execution facing while an attack is committed. */
export function resolveAttackPresentationFacing(
  attack: PlayerAttackSpatialSnapshot,
  player: Pick<PlayerMotorState, 'facing'>,
): PlayerFacingDirection {
  return attack.executionFacing ?? player.facing
}

export function computePlayerAttackPresentationPose(
  combat: CombatActionSnapshot,
): PlayerAttackPresentationPose {
  const attack = playerAttackForActionId(combat.actionId)
  if (attack === null || combat.phase === 'idle') {
    return IDLE_POSE
  }

  const progress =
    combat.phaseDurationSteps === 0
      ? 0
      : combat.phaseElapsedSteps / combat.phaseDurationSteps
  const isHeavy = attack.kind === 'heavy'
  // Keep the sweep mostly along execution facing so the readable attack axis
  // matches the authoritative contact sphere (avoid large lateral misreads).
  const maximumYaw = isHeavy ? 0.72 : 0.38
  const baseForward = -0.72
  const lunge = isHeavy ? 0.32 : 0.18

  switch (combat.phase) {
    case 'startup':
      return {
        weaponVisible: true,
        weaponYawRadians: -maximumYaw * (isHeavy ? progress * 0.95 : progress * 0.75),
        weaponForwardOffset: baseForward + (isHeavy ? 0.14 * progress : -0.04 * progress),
        color: isHeavy ? '#a88858' : '#d6c7a4',
      }
    case 'active':
      return {
        weaponVisible: true,
        weaponYawRadians: -maximumYaw + maximumYaw * 2.15 * progress,
        weaponForwardOffset: baseForward - lunge * Math.sin(progress * Math.PI),
        color: isHeavy ? '#ffb454' : '#f4d06f',
      }
    case 'recovery':
      return {
        weaponVisible: true,
        weaponYawRadians: maximumYaw * (1 - progress) * (isHeavy ? 0.85 : 0.55),
        weaponForwardOffset: baseForward + (isHeavy ? 0.08 * (1 - progress) : 0),
        color: isHeavy ? '#6f767e' : '#9da4ad',
      }
  }
}
