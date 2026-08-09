import type { Vector3Value } from '../character/playerMotor'
import type { ItemId } from '../items/itemDefinition'

export const SAVE_VERSION_V1 = 1 as const
export const SAVE_STORAGE_KEY = 'mourneveil.save.v1'

export interface SaveEchoRecoveryV1 {
  readonly active: boolean
  readonly amount: number
  readonly position: Vector3Value | null
}

export interface SaveLootPickupV1 {
  readonly active: boolean
  readonly instanceId: string | null
  readonly itemId: ItemId | null
  readonly position: Vector3Value | null
  readonly spawnedFromEnemyId: string | null
}

export interface SaveFileV1 {
  readonly version: typeof SAVE_VERSION_V1
  readonly activeCheckpointId: string | null
  readonly checkpointActivated: boolean
  readonly flaskCharges: number
  readonly echoesCarried: number
  readonly echoRecovery: SaveEchoRecoveryV1
  readonly inventory: readonly { readonly itemId: ItemId; readonly quantity: number }[]
  readonly equipment: {
    readonly weaponItemId: ItemId | null
    readonly charmItemId: ItemId | null
  }
  readonly lootPickup: SaveLootPickupV1
}

export type SaveLoadResult =
  | { readonly ok: true; readonly save: SaveFileV1 }
  | { readonly ok: false; readonly reason: 'missing' | 'malformed' | 'unsupported-version' }

export function createDefaultSaveV1(): SaveFileV1 {
  return {
    version: SAVE_VERSION_V1,
    activeCheckpointId: null,
    checkpointActivated: false,
    flaskCharges: 3,
    echoesCarried: 0,
    echoRecovery: { active: false, amount: 0, position: null },
    inventory: [],
    equipment: { weaponItemId: null, charmItemId: null },
    lootPickup: {
      active: false,
      instanceId: null,
      itemId: null,
      position: null,
      spawnedFromEnemyId: null,
    },
  }
}
