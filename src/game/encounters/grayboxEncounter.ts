import type { EnemyRuntimeSnapshot } from '../enemies/enemyRuntime'

export const GRAYBOX_MIXED_ENCOUNTER_ID = 'encounter.graybox.mixed' as const

export type GrayboxEncounterPhase = 'active' | 'complete'

export interface GrayboxEncounterSnapshot {
  readonly id: typeof GRAYBOX_MIXED_ENCOUNTER_ID
  readonly phase: GrayboxEncounterPhase
  readonly enemyIds: readonly string[]
  readonly defeatedEnemyIds: readonly string[]
}

export function createGrayboxEncounterSnapshot(
  enemyIds: readonly string[],
  enemies: readonly Pick<EnemyRuntimeSnapshot, 'id' | 'alive'>[],
): GrayboxEncounterSnapshot {
  const activeIds = [...enemyIds]
  const byId = new Map(enemies.map((enemy) => [enemy.id, enemy] as const))
  for (const id of activeIds) {
    if (!byId.has(id)) {
      throw new Error(`Encounter enemy missing from runtime: ${id}`)
    }
  }
  const defeatedEnemyIds = activeIds.filter((id) => byId.get(id)?.alive === false)
  return Object.freeze({
    id: GRAYBOX_MIXED_ENCOUNTER_ID,
    phase: defeatedEnemyIds.length === activeIds.length ? 'complete' : 'active',
    enemyIds: Object.freeze([...activeIds]),
    defeatedEnemyIds: Object.freeze(defeatedEnemyIds),
  })
}
