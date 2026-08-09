import type { PlayerFacingDirection, Vector3Value } from '../character/playerMotor'
import type { ItemId } from '../items/itemDefinition'
import type { MourneveilZoneId } from '../world/connectedLevel'
import {
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
] as const
export type M5EncounterId = (typeof M5_ENCOUNTER_IDS)[number]

export interface ConnectedEnemyPlacement {
  readonly runtimeId: string
  readonly encounterId: M5EncounterId
  readonly role: 'skirmisher' | 'brute'
  readonly spawnPosition: Vector3Value
  readonly initialFacing: PlayerFacingDirection
  readonly lootItemId: ItemId | null
}

export interface ConnectedEncounterDefinition {
  readonly id: M5EncounterId
  readonly zoneId: MourneveilZoneId
  readonly enemyIds: readonly string[]
}

export const M5_ENEMY_PLACEMENTS: readonly ConnectedEnemyPlacement[] = Object.freeze([
  // Mixed court: skirmisher holds the near approach; brute anchors the south pocket.
  definePlacement('enemy.skirmisher.1', 'encounter.m5.mixed', 'skirmisher', 1.4, -2.6, -1, 0, 'item.weapon.oathblade'),
  definePlacement('enemy.brute.1', 'encounter.m5.mixed', 'brute', 2.6, -5.4, -1, 0, 'item.charm.vitality'),
  // Introduction: stand-off just inside Outer Watch so arrival crossing feels intentional.
  definePlacement('enemy.skirmisher.introduction', 'encounter.m5.introduction', 'skirmisher', -10.2, 3.1, 1, 0, null),
  // Pressure: final-approach sentry near the ash-walk cairn, before the sealed gate.
  definePlacement('enemy.skirmisher.pressure', 'encounter.m5.pressure', 'skirmisher', 7.6, -3.4, -1, 0, null),
])

export const M5_ENCOUNTERS: readonly ConnectedEncounterDefinition[] = Object.freeze([
  defineEncounter('encounter.m5.introduction', 'zone.first-combat', ['enemy.skirmisher.introduction']),
  defineEncounter('encounter.m5.mixed', 'zone.mixed-combat', ['enemy.skirmisher.1', 'enemy.brute.1']),
  defineEncounter('encounter.m5.pressure', 'zone.final-approach', ['enemy.skirmisher.pressure']),
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
  lootItemId: ItemId | null,
): ConnectedEnemyPlacement {
  return Object.freeze({
    runtimeId,
    encounterId,
    role,
    spawnPosition: Object.freeze({ x, y: 0.82, z }),
    initialFacing: Object.freeze({ x: facingX, z: facingZ }),
    lootItemId,
  })
}

function defineEncounter(
  id: M5EncounterId,
  zoneId: MourneveilZoneId,
  enemyIds: readonly string[],
): ConnectedEncounterDefinition {
  return Object.freeze({ id, zoneId, enemyIds: Object.freeze([...enemyIds]) })
}
