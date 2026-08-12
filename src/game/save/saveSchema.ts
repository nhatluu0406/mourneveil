import type { Vector3Value } from '../character/playerMotor'
import type { ItemId } from '../items/itemDefinition'
import type { ProgressionAllocation } from '../character/playerProgression'
import { ZERO_PROGRESSION_ALLOCATION } from '../character/playerProgression'

export const SAVE_VERSION_V1 = 1 as const
export const SAVE_VERSION_V2 = 2 as const
export const SAVE_VERSION_V3 = 3 as const
export const LEGACY_SAVE_STORAGE_KEY_V1 = 'mourneveil.save.v1'
export const LEGACY_SAVE_STORAGE_KEY_V2 = 'mourneveil.save.v2'
export const SAVE_STORAGE_KEY = 'mourneveil.save.v3'

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

export interface SaveLootPickupV2 extends SaveLootPickupV1 {
  readonly spawnedFromEnemyIds: readonly string[]
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

export interface SaveWorldV2 {
  readonly openedShortcutIds: readonly string[]
  readonly finalGateReached: boolean
  readonly defeatedBossIds: readonly string[]
}

export interface SaveFileV2 {
  readonly version: typeof SAVE_VERSION_V2
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
  readonly lootPickup: SaveLootPickupV2
  readonly world: SaveWorldV2
}

export interface SaveProgressionV3 {
  readonly level: number
  readonly experience: number
  readonly unspentPoints: number
  readonly allocation: ProgressionAllocation
}

export interface SaveFileV3 {
  readonly version: typeof SAVE_VERSION_V3
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
  readonly lootPickup: SaveLootPickupV2
  readonly world: SaveWorldV2
  readonly progression: SaveProgressionV3
}

export type SaveFile = SaveFileV3

export type SaveLoadResult =
  | {
      readonly ok: true
      readonly save: SaveFileV3
      readonly migratedFromVersion: 1 | 2 | null
    }
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

export function createDefaultProgressionSave(): SaveProgressionV3 {
  return {
    level: 1,
    experience: 0,
    unspentPoints: 0,
    allocation: { ...ZERO_PROGRESSION_ALLOCATION },
  }
}

export function createDefaultSaveV2(): SaveFileV2 {
  const v1 = createDefaultSaveV1()
  return {
    ...v1,
    version: SAVE_VERSION_V2,
    lootPickup: {
      ...v1.lootPickup,
      spawnedFromEnemyIds: [],
    },
    world: {
      openedShortcutIds: [],
      finalGateReached: false,
      defeatedBossIds: [],
    },
  }
}

export function createDefaultSaveV3(): SaveFileV3 {
  const v2 = createDefaultSaveV2()
  return {
    ...v2,
    version: SAVE_VERSION_V3,
    progression: createDefaultProgressionSave(),
  }
}
