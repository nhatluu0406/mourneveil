import { useCallback, useMemo, useState } from 'react'
import {
  GameSaveService,
  LocalStorageSaveStorage,
} from '../game/save/gameSaveService'
import {
  resolveInitialSessionIntent,
  type GameSessionIntent,
} from '../game/save/sessionIntent'

export function createBrowserSaveService(): GameSaveService {
  return new GameSaveService(
    typeof localStorage === 'undefined'
      ? {
          readRaw: () => null,
          writeRaw: () => undefined,
          clear: () => undefined,
        }
      : new LocalStorageSaveStorage(localStorage),
  )
}

export function useGameSession(): {
  readonly saveService: GameSaveService
  readonly intent: GameSessionIntent | null
  readonly hasSave: boolean
  readonly confirmingNewRite: boolean
  readonly chooseContinue: () => void
  readonly chooseNewRite: () => void
  readonly confirmNewRite: () => void
  readonly cancelNewRite: () => void
} {
  const saveService = useMemo(() => createBrowserSaveService(), [])
  const [intent, setIntent] = useState<GameSessionIntent | null>(() =>
    typeof window === 'undefined' ? null : resolveInitialSessionIntent(window.location.search),
  )
  const [hasSave] = useState(() => saveService.hasValidSave())
  const [confirmingNewRite, setConfirmingNewRite] = useState(false)

  const chooseContinue = useCallback(() => {
    setConfirmingNewRite(false)
    setIntent('continue')
  }, [])

  const chooseNewRite = useCallback(() => {
    if (hasSave) {
      setConfirmingNewRite(true)
      return
    }
    setIntent('new-rite')
  }, [hasSave])

  const confirmNewRite = useCallback(() => {
    setConfirmingNewRite(false)
    setIntent('new-rite')
  }, [])

  const cancelNewRite = useCallback(() => {
    setConfirmingNewRite(false)
  }, [])

  return {
    saveService,
    intent,
    hasSave,
    confirmingNewRite,
    chooseContinue,
    chooseNewRite,
    confirmNewRite,
    cancelNewRite,
  }
}
