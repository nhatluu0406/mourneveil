import { GameRuntime } from '../runtime/GameRuntime'
import type { GameSaveService } from './gameSaveService'
import type { GameSessionIntent } from './sessionIntent'

/** Construct runtime only after session intent is known. New Rite clears all save keys first. */
export function constructGameSession(
  intent: GameSessionIntent,
  saveService: GameSaveService,
): GameRuntime {
  if (intent === 'new-rite') {
    saveService.clear()
  }
  const runtime = new GameRuntime()
  if (intent === 'continue') {
    const loaded = saveService.load()
    if (loaded.ok) runtime.applySave(loaded.save)
  }
  runtime.setPersistHandler(() => {
    saveService.save(runtime.captureSave())
  })
  return runtime
}
