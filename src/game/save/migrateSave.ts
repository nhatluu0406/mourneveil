import {
  SAVE_VERSION_V1,
  SAVE_VERSION_V2,
  createDefaultSaveV1,
  createDefaultSaveV2,
  type SaveFileV1,
  type SaveFileV2,
  type SaveLoadResult,
} from './saveSchema'

/**
 * Migration entry point. Only V1 exists; unknown versions reject safely.
 */
export function migrateAndValidateSave(raw: unknown): SaveLoadResult {
  if (raw === null || raw === undefined) {
    return { ok: false, reason: 'missing' }
  }
  if (typeof raw !== 'object') {
    return { ok: false, reason: 'malformed' }
  }
  const record = raw as Record<string, unknown>
  if (!('version' in record)) {
    return { ok: false, reason: 'malformed' }
  }
  if (record.version !== SAVE_VERSION_V1 && record.version !== SAVE_VERSION_V2) {
    return { ok: false, reason: 'unsupported-version' }
  }
  try {
    if (record.version === SAVE_VERSION_V1) {
      return {
        ok: true,
        save: migrateV1ToV2(validateSaveV1(record)),
        migratedFromVersion: SAVE_VERSION_V1,
      }
    }
    return {
      ok: true,
      save: validateSaveV2(record),
      migratedFromVersion: null,
    }
  } catch {
    return { ok: false, reason: 'malformed' }
  }
}

export function migrateV1ToV2(save: SaveFileV1): SaveFileV2 {
  return {
    ...save,
    version: SAVE_VERSION_V2,
    lootPickup: {
      ...save.lootPickup,
      spawnedFromEnemyIds:
        save.lootPickup.spawnedFromEnemyId === null
          ? []
          : [save.lootPickup.spawnedFromEnemyId],
    },
    world: {
      openedShortcutIds: [],
      finalGateReached: false,
      defeatedBossIds: [],
    },
  }
}

function validateSaveV2(record: Record<string, unknown>): SaveFileV2 {
  const defaults = createDefaultSaveV2()
  const common = validateCommonSave(record)
  return {
    version: SAVE_VERSION_V2,
    ...common,
    lootPickup: asLootV2(record.lootPickup),
    world: asWorld(record.world, defaults.world),
  }
}

function validateSaveV1(record: Record<string, unknown>): SaveFileV1 {
  return { version: SAVE_VERSION_V1, ...validateCommonSave(record) }
}

function validateCommonSave(record: Record<string, unknown>): Omit<SaveFileV1, 'version'> {
  const defaults = createDefaultSaveV1()
  const checkpointActivated = Boolean(record.checkpointActivated)
  const activeCheckpointId =
    record.activeCheckpointId === null || typeof record.activeCheckpointId === 'string'
      ? (record.activeCheckpointId as string | null)
      : null
  const flaskCharges = asNonNegativeInt(record.flaskCharges, defaults.flaskCharges)
  const echoesCarried = asNonNegativeInt(record.echoesCarried, defaults.echoesCarried)
  const echoRecovery = asEchoRecovery(record.echoRecovery)
  const inventory = asInventory(record.inventory)
  const equipment = asEquipment(record.equipment)
  const lootPickup = asLoot(record.lootPickup)
  return {
    activeCheckpointId,
    checkpointActivated,
    flaskCharges,
    echoesCarried,
    echoRecovery,
    inventory,
    equipment,
    lootPickup,
  }
}

function asWorld(value: unknown, fallback: SaveFileV2['world']): SaveFileV2['world'] {
  if (value === null || typeof value !== 'object') return fallback
  const record = value as Record<string, unknown>
  const openedShortcutIds = Array.isArray(record.openedShortcutIds)
    ? [...new Set(record.openedShortcutIds.filter((id): id is string => typeof id === 'string'))]
    : []
  const defeatedBossIds = Array.isArray(record.defeatedBossIds)
    ? [...new Set(record.defeatedBossIds.filter((id): id is string => typeof id === 'string'))]
    : []
  return {
    openedShortcutIds,
    finalGateReached: Boolean(record.finalGateReached),
    defeatedBossIds,
  }
}

function asNonNegativeInt(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback
}

function asEchoRecovery(value: unknown): SaveFileV1['echoRecovery'] {
  if (value === null || typeof value !== 'object') {
    return { active: false, amount: 0, position: null }
  }
  const record = value as Record<string, unknown>
  const active = Boolean(record.active)
  const amount = asNonNegativeInt(record.amount, 0)
  const position = asPosition(record.position)
  if (!active || amount <= 0 || position === null) {
    return { active: false, amount: 0, position: null }
  }
  return { active: true, amount, position }
}

function asInventory(value: unknown): SaveFileV1['inventory'] {
  if (!Array.isArray(value)) return []
  const entries: SaveFileV1['inventory'][number][] = []
  for (const entry of value) {
    if (entry === null || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    if (typeof record.itemId !== 'string') continue
    const quantity = asNonNegativeInt(record.quantity, 0)
    if (quantity <= 0) continue
    entries.push({ itemId: record.itemId, quantity })
  }
  return entries
}

function asEquipment(value: unknown): SaveFileV1['equipment'] {
  if (value === null || typeof value !== 'object') {
    return { weaponItemId: null, charmItemId: null }
  }
  const record = value as Record<string, unknown>
  return {
    weaponItemId: typeof record.weaponItemId === 'string' ? record.weaponItemId : null,
    charmItemId: typeof record.charmItemId === 'string' ? record.charmItemId : null,
  }
}

function asLoot(value: unknown): SaveFileV1['lootPickup'] {
  if (value === null || typeof value !== 'object') {
    return {
      active: false,
      instanceId: null,
      itemId: null,
      position: null,
      spawnedFromEnemyId: null,
    }
  }
  const record = value as Record<string, unknown>
  return {
    active: Boolean(record.active),
    instanceId: typeof record.instanceId === 'string' ? record.instanceId : null,
    itemId: typeof record.itemId === 'string' ? record.itemId : null,
    position: asPosition(record.position),
    spawnedFromEnemyId:
      typeof record.spawnedFromEnemyId === 'string' ? record.spawnedFromEnemyId : null,
  }
}

function asLootV2(value: unknown): SaveFileV2['lootPickup'] {
  const legacy = asLoot(value)
  if (value === null || typeof value !== 'object') {
    return { ...legacy, spawnedFromEnemyIds: [] }
  }
  const record = value as Record<string, unknown>
  const storedIds = Array.isArray(record.spawnedFromEnemyIds)
    ? record.spawnedFromEnemyIds.filter((id): id is string => typeof id === 'string')
    : []
  return {
    ...legacy,
    spawnedFromEnemyIds: [
      ...new Set([
        ...storedIds,
        ...(legacy.spawnedFromEnemyId === null ? [] : [legacy.spawnedFromEnemyId]),
      ]),
    ],
  }
}

function asPosition(value: unknown): { x: number; y: number; z: number } | null {
  if (value === null || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const { x, y, z } = record
  if (![x, y, z].every((component) => typeof component === 'number' && Number.isFinite(component))) {
    return null
  }
  return { x: x as number, y: y as number, z: z as number }
}
