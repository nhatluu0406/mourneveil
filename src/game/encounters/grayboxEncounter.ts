import type { EnemyRuntimeSnapshot } from '../enemies/enemyRuntime'

export const GRAYBOX_MIXED_ENCOUNTER_ID = 'encounter.graybox.mixed' as const

export type GrayboxEncounterPhase = 'active' | 'complete'

export interface GrayboxEncounterSnapshot {
  readonly id: typeof GRAYBOX_MIXED_ENCOUNTER_ID
  readonly phase: GrayboxEncounterPhase
  readonly enemyIds: readonly string[]
  readonly defeatedEnemyIds: readonly string[]
}

export interface EncounterSnapshot {
  readonly id: string
  readonly phase: GrayboxEncounterPhase
  readonly enemyIds: readonly string[]
  readonly defeatedEnemyIds: readonly string[]
}

export function createEncounterSnapshot(
  id: string,
  enemyIds: readonly string[],
  enemies: readonly Pick<EnemyRuntimeSnapshot, 'id' | 'alive'>[],
): EncounterSnapshot {
  const byId = new Map(enemies.map((enemy) => [enemy.id, enemy] as const))
  for (const enemyId of enemyIds) {
    if (!byId.has(enemyId)) throw new Error(`Encounter enemy missing from runtime: ${enemyId}`)
  }
  const defeatedEnemyIds = enemyIds.filter((enemyId) => byId.get(enemyId)?.alive === false)
  return Object.freeze({
    id,
    phase: defeatedEnemyIds.length === enemyIds.length ? 'complete' : 'active',
    enemyIds: Object.freeze([...enemyIds]),
    defeatedEnemyIds: Object.freeze(defeatedEnemyIds),
  })
}

export function createGrayboxEncounterSnapshot(
  enemyIds: readonly string[],
  enemies: readonly Pick<EnemyRuntimeSnapshot, 'id' | 'alive'>[],
): GrayboxEncounterSnapshot {
  const snapshot = createEncounterSnapshot(GRAYBOX_MIXED_ENCOUNTER_ID, enemyIds, enemies)
  return Object.freeze({
    id: GRAYBOX_MIXED_ENCOUNTER_ID,
    phase: snapshot.phase,
    enemyIds: snapshot.enemyIds,
    defeatedEnemyIds: snapshot.defeatedEnemyIds,
  })
}
