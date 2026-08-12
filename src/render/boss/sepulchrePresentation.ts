import type { CombatActionPhase } from '../../game/combat/combatAction'

export type SepulchreAttackKind = 'slash' | 'crush' | 'lunge' | 'slam' | null

export interface SepulchrePresentationInput {
  readonly alive: boolean
  readonly healthCurrent: number
  readonly healthMaximum: number
  readonly actionId: string | null
  readonly phase: CombatActionPhase | 'idle'
  readonly phaseProgress: number
  readonly hitReacting: boolean
}

export interface SepulchrePresentation {
  readonly attack: SepulchreAttackKind
  readonly phaseTwo: boolean
  readonly committed: boolean
  /** Startup telegraph only — never implies damage outside the active window. */
  readonly startupCue: SepulchreAttackKind
  readonly bodyPitch: number
  readonly bodyOffsetZ: number
  readonly weaponPitch: number
  readonly weaponYaw: number
  readonly weaponRoll: number
  readonly coreExposure: number
  readonly impactAccent: number
  readonly defeated: boolean
}

export function sepulchreAttackKind(actionId: string | null): SepulchreAttackKind {
  if (actionId === null) return null
  if (actionId.endsWith('.slash')) return 'slash'
  if (actionId.endsWith('.crush')) return 'crush'
  if (actionId.endsWith('.lunge')) return 'lunge'
  if (actionId.endsWith('.slam')) return 'slam'
  return null
}

/** Pure presentation projection. It never advances or mutates gameplay state. */
export function resolveSepulchrePresentation(
  input: SepulchrePresentationInput,
): SepulchrePresentation {
  const progress = Math.max(0, Math.min(1, input.phaseProgress))
  const attack = sepulchreAttackKind(input.actionId)
  const phaseTwo = input.healthMaximum > 0 && input.healthCurrent / input.healthMaximum <= 0.5
  const committed = input.alive && attack !== null && input.phase !== 'idle'
  let bodyPitch = input.hitReacting ? -0.12 : 0
  let bodyOffsetZ = 0
  let weaponPitch = -0.22
  let weaponYaw = -0.18
  let weaponRoll = -0.12

  if (committed) {
    const strike = input.phase === 'active' ? 1 : input.phase === 'startup' ? progress : 1 - progress
    switch (attack) {
      case 'slash':
        weaponPitch = -0.35
        weaponYaw = input.phase === 'startup' ? 0.45 + progress * 0.72 : -0.92 * strike
        weaponRoll = -0.62
        bodyPitch -= 0.08 * strike
        break
      case 'crush':
        weaponPitch = input.phase === 'startup' ? -0.55 - progress * 0.9 : 0.58 * strike
        weaponYaw = 0.05
        weaponRoll = -0.05
        bodyPitch = input.phase === 'startup' ? -0.14 * progress : 0.18 * strike
        break
      case 'lunge':
        weaponPitch = 0.08
        weaponYaw = 0.02
        weaponRoll = -Math.PI / 2
        bodyPitch = -0.22 * strike
        bodyOffsetZ = input.phase === 'startup' ? 0.18 * progress : -0.22 * strike
        break
      case 'slam':
        weaponPitch = input.phase === 'startup' ? -0.72 - progress * 0.85 : 0.72 * strike
        weaponYaw = 0
        weaponRoll = 0
        bodyPitch = input.phase === 'startup' ? -0.18 * progress : 0.25 * strike
        break
      case null:
        break
    }
  }

  const startupCue =
    committed && input.phase === 'startup' && attack !== null ? attack : null

  return {
    attack,
    phaseTwo,
    committed,
    startupCue,
    bodyPitch: input.alive ? bodyPitch : -0.9,
    bodyOffsetZ,
    weaponPitch,
    weaponYaw,
    weaponRoll,
    coreExposure: input.alive ? (phaseTwo ? 1 : 0) : 0.35,
    impactAccent: committed && input.phase === 'active' ? 1 : input.hitReacting ? 0.7 : 0,
    defeated: !input.alive,
  }
}
