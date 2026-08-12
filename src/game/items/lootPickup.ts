import type { Vector3Value } from '../character/playerMotor'
import { getItemDefinition, type ItemId } from './itemDefinition'

export const LOOT_PICKUP_RANGE = 1.05

export interface LootPickupSnapshot {
  readonly active: boolean
  readonly instanceId: string | null
  readonly itemId: ItemId | null
  readonly position: Vector3Value | null
  readonly spawnedFromEnemyIds: readonly string[]
}

export type LootPickupResult =
  | { readonly accepted: true; readonly itemId: ItemId; readonly instanceId: string }
  | {
      readonly accepted: false
      readonly reason: 'inactive' | 'out-of-range' | 'actor-dead'
    }

/**
 * At most one active authored loot pickup for the M4 proof.
 * Spawned once from an enemy defeat; repeated overlap cannot duplicate.
 */
export class LootPickupRuntime {
  private active = false
  private instanceId: string | null = null
  private itemId: ItemId | null = null
  private position: Vector3Value | null = null
  private activeSpawnedFromEnemyId: string | null = null
  private readonly spawnedFromEnemyIds = new Set<string>()

  spawnFromEnemy(
    enemyId: string,
    itemId: ItemId,
    position: Vector3Value,
    instanceId: string,
  ): boolean {
    if (this.spawnedFromEnemyIds.has(enemyId)) return false
    if (getItemDefinition(itemId) === null) {
      throw new Error(`Cannot spawn unknown loot item: ${itemId}`)
    }
    assertFiniteVector(position, 'Loot pickup position')
    this.active = true
    this.instanceId = instanceId
    this.itemId = itemId
    this.position = { ...position }
    this.activeSpawnedFromEnemyId = enemyId
    this.spawnedFromEnemyIds.add(enemyId)
    return true
  }

  rememberEnemySpawn(enemyId: string): boolean {
    if (this.spawnedFromEnemyIds.has(enemyId)) return false
    this.spawnedFromEnemyIds.add(enemyId)
    return true
  }

  tryPickup(playerPosition: Vector3Value, playerAlive: boolean): LootPickupResult {
    if (!playerAlive) return { accepted: false, reason: 'actor-dead' }
    if (!this.active || this.itemId === null || this.instanceId === null || this.position === null) {
      return { accepted: false, reason: 'inactive' }
    }
    if (horizontalDistance(playerPosition, this.position) > LOOT_PICKUP_RANGE) {
      return { accepted: false, reason: 'out-of-range' }
    }
    const itemId = this.itemId
    const instanceId = this.instanceId
    this.active = false
    this.itemId = null
    this.instanceId = null
    this.position = null
    this.activeSpawnedFromEnemyId = null
    return { accepted: true, itemId, instanceId }
  }

  /** Encounter reset clears the world pickup but keeps spawn memory unless full reset. */
  clearActivePickup(): void {
    this.active = false
    this.itemId = null
    this.instanceId = null
    this.position = null
  }

  resetLifecycle(): void {
    this.clearActivePickup()
    this.spawnedFromEnemyIds.clear()
  }

  restore(snapshot: {
    readonly active: boolean
    readonly instanceId: string | null
    readonly itemId: ItemId | null
    readonly position: Vector3Value | null
    readonly spawnedFromEnemyId: string | null
    readonly spawnedFromEnemyIds?: readonly string[]
  }): void {
    this.active = snapshot.active
    this.instanceId = snapshot.instanceId
    this.itemId = snapshot.itemId
    this.position = snapshot.position === null ? null : { ...snapshot.position }
    this.activeSpawnedFromEnemyId = snapshot.spawnedFromEnemyId
    this.spawnedFromEnemyIds.clear()
    for (const enemyId of snapshot.spawnedFromEnemyIds ?? []) {
      this.spawnedFromEnemyIds.add(enemyId)
    }
    if (snapshot.spawnedFromEnemyId !== null) {
      this.spawnedFromEnemyIds.add(snapshot.spawnedFromEnemyId)
    }
  }

  snapshot(): LootPickupSnapshot & { readonly spawnedFromEnemyId: string | null } {
    return {
      active: this.active,
      instanceId: this.instanceId,
      itemId: this.itemId,
      position: this.position === null ? null : { ...this.position },
      spawnedFromEnemyId: this.activeSpawnedFromEnemyId,
      spawnedFromEnemyIds: [...this.spawnedFromEnemyIds].sort(),
    }
  }
}

function horizontalDistance(left: Vector3Value, right: Vector3Value): number {
  return Math.hypot(left.x - right.x, left.z - right.z)
}

function assertFiniteVector(value: Vector3Value, label: string): void {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must contain only finite values`)
  }
}
