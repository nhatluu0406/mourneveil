import { migrateAndValidateSave } from './migrateSave'
import {
  SAVE_STORAGE_KEY,
  LEGACY_SAVE_STORAGE_KEY_V1,
  createDefaultSaveV2,
  type SaveFileV2,
  type SaveLoadResult,
} from './saveSchema'

export interface SaveStorage {
  readRaw(): string | null
  writeRaw(value: string): void
  clear(): void
}

export class LocalStorageSaveStorage implements SaveStorage {
  constructor(
    private readonly storage: Storage,
    private readonly key: string = SAVE_STORAGE_KEY,
    private readonly legacyKey: string = LEGACY_SAVE_STORAGE_KEY_V1,
  ) {}

  readRaw(): string | null {
    try {
      return this.storage.getItem(this.key) ?? this.storage.getItem(this.legacyKey)
    } catch {
      return null
    }
  }

  writeRaw(value: string): void {
    try {
      this.storage.setItem(this.key, value)
      if (this.legacyKey !== this.key) this.storage.removeItem(this.legacyKey)
    } catch {
      // Quota / private mode — ignore for local slice.
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(this.key)
      if (this.legacyKey !== this.key) this.storage.removeItem(this.legacyKey)
    } catch {
      // ignore
    }
  }
}

export class MemorySaveStorage implements SaveStorage {
  private value: string | null = null

  readRaw(): string | null {
    return this.value
  }

  writeRaw(value: string): void {
    this.value = value
  }

  clear(): void {
    this.value = null
  }
}

export class GameSaveService {
  constructor(private readonly storage: SaveStorage) {}

  save(save: SaveFileV2): void {
    this.storage.writeRaw(JSON.stringify(save))
  }

  load(): SaveLoadResult {
    const raw = this.storage.readRaw()
    if (raw === null) return { ok: false, reason: 'missing' }
    try {
      return migrateAndValidateSave(JSON.parse(raw) as unknown)
    } catch {
      return { ok: false, reason: 'malformed' }
    }
  }

  loadOrDefault(): SaveFileV2 {
    const result = this.load()
    return result.ok ? result.save : createDefaultSaveV2()
  }

  clear(): void {
    this.storage.clear()
  }
}
