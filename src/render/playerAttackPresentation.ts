import type { CombatActionSnapshot } from '../game/combat/combatActionRuntime'
import { playerAttackForActionId } from '../game/combat/playerAttackActions'

export interface PlayerAttackPresentationPose {
  readonly weaponVisible: boolean
  readonly weaponYawRadians: number
  readonly color: string
}

const IDLE_POSE: PlayerAttackPresentationPose = Object.freeze({
  weaponVisible: false,
  weaponYawRadians: 0,
  color: '#d6c7a4',
})

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
  const maximumYaw = attack.kind === 'heavy' ? 1.35 : 0.9

  switch (combat.phase) {
    case 'startup':
      return {
        weaponVisible: true,
        weaponYawRadians: -maximumYaw * progress,
        color: '#d6c7a4',
      }
    case 'active':
      return {
        weaponVisible: true,
        weaponYawRadians: -maximumYaw + maximumYaw * 2 * progress,
        color: '#f4d06f',
      }
    case 'recovery':
      return {
        weaponVisible: true,
        weaponYawRadians: maximumYaw * (1 - progress),
        color: '#9da4ad',
      }
  }
}
