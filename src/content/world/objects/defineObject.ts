import type { WorldObjectDefinition } from '../worldObjectTypes'

const UNIT = Object.freeze([1, 1, 1] as const)

export function defineObject(
  partial: Omit<WorldObjectDefinition, 'defaultScale'> & {
    readonly defaultScale?: readonly [number, number, number]
  },
): WorldObjectDefinition {
  return Object.freeze({
    defaultScale: UNIT,
    collision: { kind: 'none' },
    lighting: { kind: 'none' },
    interaction: { kind: 'none' },
    ...partial,
  }) as WorldObjectDefinition
}
