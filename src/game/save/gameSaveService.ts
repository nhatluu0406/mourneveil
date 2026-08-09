import { migrateAndValidateSave } from './migrateSave'
import {
  SAVE_STORAGE_KEY,
  createDefaultSaveV1,
  type SaveFileV1,
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
  ) {}

  readRaw(): string | null {
    try {
      return this.storage.getItem(this.key)
    } catch {
      return null
    }
  }

  writeRaw(value: string): void {
    try {
      this.storage.setItem(this.key, value)
    } catch {
      // Quota / private mode — ignore for local slice.
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(this.key)
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

  save(save: SaveFileV1): void {
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

  loadOrDefault(): SaveFileV1 {
    const result = this.load()
    return result.ok ? result.save : createDefaultSaveV1()
  }

  clear(): void {
    this.storage.clear()
  }
}
