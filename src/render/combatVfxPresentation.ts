import type { CombatHitEvent } from '../game/combat/combatContact'

export type CombatVfxKind =
  | 'light-hit'
  | 'heavy-hit'
  | 'guard'
  | 'guard-break'
  | 'damage'

export interface CombatVfxPresentation {
  readonly kind: CombatVfxKind
  readonly color: string
  readonly intensity: number
  readonly progress: number
  readonly visible: boolean
}

const VFX_DURATION_STEPS = 22

export function resolveCombatVfxPresentation(
  event: CombatHitEvent | null,
  simulationStep: number,
): CombatVfxPresentation {
  const age = event === null ? VFX_DURATION_STEPS : simulationStep - event.simulationStep
  const visible = event !== null && age >= 0 && age < VFX_DURATION_STEPS
  const progress = visible ? age / VFX_DURATION_STEPS : 1
  const kind: CombatVfxKind =
    event?.outcome === 'guard-broken'
      ? 'guard-break'
      : event?.outcome === 'guarded'
        ? 'guard'
        : event?.attackerId === 'player'
          ? event.actionId.includes('heavy')
            ? 'heavy-hit'
            : 'light-hit'
          : 'damage'
  const style = {
    'light-hit': { color: '#e1c783', intensity: 0.82 },
    'heavy-hit': { color: '#e58a49', intensity: 1 },
    guard: { color: '#75ced5', intensity: 0.78 },
    'guard-break': { color: '#ed674d', intensity: 1 },
    damage: { color: '#c64e48', intensity: 0.88 },
  }[kind]
  return { kind, ...style, progress, visible }
}
