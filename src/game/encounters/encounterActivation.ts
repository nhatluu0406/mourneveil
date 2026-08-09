import type { Vector3Value } from '../character/playerMotor'
import {
  MOURNEVEIL_CONNECTED_LEVEL,
  type ConnectedLevelDefinition,
  type MourneveilZoneId,
  type ZoneBounds,
} from '../world/connectedLevel'
import {
  M5_ENCOUNTERS,
  type ConnectedEncounterDefinition,
  type M5EncounterId,
  connectedEnemyPlacementByRuntimeId,
} from './connectedLevelEncounters'

export interface EncounterActivationSnapshot {
  readonly activatedEncounterIds: readonly M5EncounterId[]
}

/**
 * M5 activation policy:
 * - encounters start inactive;
 * - entering the authored zone activates the encounter permanently until reset;
 * - inactive enemies neither perceive nor attack;
 * - active enemies only pursue/attack while the player remains inside the
 *   encounter zone (or a small egress margin), preventing cross-level chases.
 */
export class EncounterActivationRuntime {
  private readonly activated = new Set<M5EncounterId>()

  constructor(
    private readonly encounters: readonly ConnectedEncounterDefinition[] = M5_ENCOUNTERS,
    private readonly level: ConnectedLevelDefinition = MOURNEVEIL_CONNECTED_LEVEL,
  ) {}

  update(playerPosition: Vector3Value): void {
    for (const encounter of this.encounters) {
      if (this.activated.has(encounter.id)) continue
      if (positionInBounds(playerPosition, zoneBounds(encounter.zoneId, this.level))) {
        this.activated.add(encounter.id)
      }
    }
  }

  reset(): void {
    this.activated.clear()
  }

  isEncounterActivated(encounterId: M5EncounterId): boolean {
    return this.activated.has(encounterId)
  }

  isEnemySimulationEnabled(enemyId: string, playerPosition: Vector3Value): boolean {
    const placement = connectedEnemyPlacementByRuntimeId(enemyId)
    if (placement === null) return false
    if (!this.activated.has(placement.encounterId)) return false
    const encounter = this.encounters.find((entry) => entry.id === placement.encounterId)
    if (encounter === undefined) return false
    return positionInBounds(
      playerPosition,
      expandBounds(zoneBounds(encounter.zoneId, this.level), 0.35),
    )
  }

  snapshot(): EncounterActivationSnapshot {
    return {
      activatedEncounterIds: Object.freeze(
        [...this.activated].sort((left, right) => left.localeCompare(right)),
      ),
    }
  }
}

function zoneBounds(
  zoneId: MourneveilZoneId,
  level: ConnectedLevelDefinition,
): ZoneBounds {
  const zone = level.zones.find((entry) => entry.id === zoneId)
  if (zone === undefined) {
    throw new Error(`Missing encounter zone: ${zoneId}`)
  }
  return zone.bounds
}

function expandBounds(bounds: ZoneBounds, margin: number): ZoneBounds {
  return {
    minimumX: bounds.minimumX - margin,
    maximumX: bounds.maximumX + margin,
    minimumZ: bounds.minimumZ - margin,
    maximumZ: bounds.maximumZ + margin,
  }
}

function positionInBounds(position: Vector3Value, bounds: ZoneBounds): boolean {
  return (
    position.x >= bounds.minimumX &&
    position.x <= bounds.maximumX &&
    position.z >= bounds.minimumZ &&
    position.z <= bounds.maximumZ
  )
}
