import { migrateAndValidateSave } from './migrateSave'
import {
  SAVE_STORAGE_KEY,
  LEGACY_SAVE_STORAGE_KEY_V1,
  LEGACY_SAVE_STORAGE_KEY_V2,
  LEGACY_SAVE_STORAGE_KEY_V3,
  createDefaultSaveV4,
  type SaveFileV4,
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
    private readonly legacyKeys: readonly string[] = [
      LEGACY_SAVE_STORAGE_KEY_V3,
      LEGACY_SAVE_STORAGE_KEY_V2,
      LEGACY_SAVE_STORAGE_KEY_V1,
    ],
  ) {}

  readRaw(): string | null {
    try {
      const current = this.storage.getItem(this.key)
      if (current !== null) return current
      for (const legacy of this.legacyKeys) {
        const value = this.storage.getItem(legacy)
        if (value !== null) return value
      }
      return null
    } catch {
      return null
    }
  }

  writeRaw(value: string): void {
    try {
      this.storage.setItem(this.key, value)
      for (const legacy of this.legacyKeys) {
        this.storage.removeItem(legacy)
      }
    } catch {
      // Quota / private mode — ignore for local slice.
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(this.key)
      for (const legacy of this.legacyKeys) {
        this.storage.removeItem(legacy)
      }
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

  save(save: SaveFileV4): void {
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

  loadOrDefault(): SaveFileV4 {
    const result = this.load()
    return result.ok ? result.save : createDefaultSaveV4()
  }

  clear(): void {
    this.storage.clear()
  }
}
