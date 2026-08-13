import type { PlayerFacingDirection, Vector3Value } from '../character/playerMotor'
import type { LootTableId } from '../items/lootTables'
import type { MourneveilZoneId } from '../world/connectedLevel'
import {
  BOSS_ENCOUNTER_ID,
  BOSS_RUNTIME_ID,
} from '../enemies/bossKit'
import {
  BOSS_ROLE,
  BRUTE_ROLE,
  SKIRMISHER_ROLE,
  createEnemyRuntimeFromRole,
  type EnemyMeleeRoleSpec,
} from '../enemies/enemyRoles'
import type { EnemyRuntime } from '../enemies/enemyRuntime'

export const M5_ENCOUNTER_IDS = [
  'encounter.m5.introduction',
  'encounter.m5.mixed',
  'encounter.m5.pressure',
  BOSS_ENCOUNTER_ID,
] as const
export type M5EncounterId = (typeof M5_ENCOUNTER_IDS)[number]

/** Gate open prerequisites exclude the arena boss (boss lives behind the gate). */
export const FINAL_GATE_PREREQUISITE_ENCOUNTER_IDS = [
  'encounter.m5.introduction',
  'encounter.m5.mixed',
  'encounter.m5.pressure',
] as const satisfies readonly M5EncounterId[]

export interface ConnectedEnemyPlacement {
  readonly runtimeId: string
  readonly encounterId: M5EncounterId
  readonly role: 'skirmisher' | 'brute' | 'boss'
  readonly spawnPosition: Vector3Value
  readonly initialFacing: PlayerFacingDirection
  /** Authored loot table; null means no drop from this placement. */
  readonly lootTableId: LootTableId | null
}

export interface ConnectedEncounterDefinition {
  readonly id: M5EncounterId
  readonly zoneId: MourneveilZoneId
  readonly enemyIds: readonly string[]
}

export const M5_ENEMY_PLACEMENTS: readonly ConnectedEnemyPlacement[] = Object.freeze([
  // Mixed court: skirmisher holds the near approach; brute anchors the south pocket.
  definePlacement('enemy.skirmisher.1', 'encounter.m5.mixed', 'skirmisher', 2.1, -2.6, -1, 0, 'loot.skirmisher-early'),
  definePlacement('enemy.brute.1', 'encounter.m5.mixed', 'brute', 2.6, -5.4, -1, 0, 'loot.brute-middle'),
  // Introduction: early survivability charm teach.
  definePlacement(
    'enemy.skirmisher.introduction',
    'encounter.m5.introduction',
    'skirmisher',
    -10.2,
    3.1,
    1,
    0,
    'loot.intro-survivability',
  ),
  // Pressure: final-approach sentry near the ash-walk cairn, before the sealed gate.
  definePlacement('enemy.skirmisher.pressure', 'encounter.m5.pressure', 'skirmisher', 7.6, -3.4, -1, 0, 'loot.pressure'),
  // M11 technical boss in sealed arena (gameplay foundation; Codex owns art later).
  definePlacement(BOSS_RUNTIME_ID, BOSS_ENCOUNTER_ID, 'boss', 13, -4, -1, 0, 'loot.boss-rite'),
])

export const M5_ENCOUNTERS: readonly ConnectedEncounterDefinition[] = Object.freeze([
  defineEncounter('encounter.m5.introduction', 'zone.first-combat', ['enemy.skirmisher.introduction']),
  defineEncounter('encounter.m5.mixed', 'zone.mixed-combat', ['enemy.skirmisher.1', 'enemy.brute.1']),
  defineEncounter('encounter.m5.pressure', 'zone.final-approach', ['enemy.skirmisher.pressure']),
  defineEncounter(BOSS_ENCOUNTER_ID, 'zone.final-arena', [BOSS_RUNTIME_ID]),
])

export function validateConnectedEncounterPlacements(
  encounters: readonly ConnectedEncounterDefinition[] = M5_ENCOUNTERS,
  placements: readonly ConnectedEnemyPlacement[] = M5_ENEMY_PLACEMENTS,
): void {
  const placementIds = new Set<string>()
  const encounterIds = new Set(encounters.map((encounter) => encounter.id))
  for (const placement of placements) {
    if (placementIds.has(placement.runtimeId)) {
      throw new Error(`Duplicate connected-level enemy runtime ID: ${placement.runtimeId}`)
    }
    placementIds.add(placement.runtimeId)
    if (!encounterIds.has(placement.encounterId)) {
      throw new Error(`Enemy ${placement.runtimeId} references missing encounter: ${placement.encounterId}`)
    }
  }
  for (const encounter of encounters) {
    for (const enemyId of encounter.enemyIds) {
      const placement = placements.find((entry) => entry.runtimeId === enemyId)
      if (placement === undefined || placement.encounterId !== encounter.id) {
        throw new Error(`Encounter ${encounter.id} has invalid enemy placement: ${enemyId}`)
      }
    }
  }
}

export function connectedEnemyPlacementByRuntimeId(runtimeId: string): ConnectedEnemyPlacement | null {
  return M5_ENEMY_PLACEMENTS.find((placement) => placement.runtimeId === runtimeId) ?? null
}

export function createConnectedLevelEnemyRuntimes(): EnemyRuntime[] {
  validateConnectedEncounterPlacements()
  return M5_ENEMY_PLACEMENTS.map((placement) => {
    const role = roleForPlacement(placement)
    return createEnemyRuntimeFromRole(
      role,
      placement.runtimeId,
      placement.spawnPosition,
      placement.initialFacing,
    )
  })
}

function roleForPlacement(placement: ConnectedEnemyPlacement): EnemyMeleeRoleSpec {
  if (placement.role === 'boss') return BOSS_ROLE
  return placement.role === 'brute' ? BRUTE_ROLE : SKIRMISHER_ROLE
}

function definePlacement(
  runtimeId: string,
  encounterId: M5EncounterId,
  role: ConnectedEnemyPlacement['role'],
  x: number,
  z: number,
  facingX: number,
  facingZ: number,
  lootTableId: LootTableId | null,
): ConnectedEnemyPlacement {
  return Object.freeze({
    runtimeId,
    encounterId,
    role,
    spawnPosition: Object.freeze({ x, y: 0.82, z }),
    initialFacing: Object.freeze({ x: facingX, z: facingZ }),
    lootTableId,
  })
}

function defineEncounter(
  id: M5EncounterId,
  zoneId: MourneveilZoneId,
  enemyIds: readonly string[],
): ConnectedEncounterDefinition {
  return Object.freeze({ id, zoneId, enemyIds: Object.freeze([...enemyIds]) })
}
