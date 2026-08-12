import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GameRuntime,
  type GameRuntimeSnapshot,
} from '../game/runtime/GameRuntime'
import {
  GameSaveService,
  LocalStorageSaveStorage,
} from '../game/save/gameSaveService'
import { BrowserAttackInput } from '../input/browserAttackInput'
import type { AimDirectionResolver, CombatInputSnapshot } from '../input/browserAttackInput'
import { BrowserGamepadInput } from '../input/browserGamepadInput'
import { BrowserMovementInput } from '../input/browserMovementInput'
import {
  composeMovementIntents,
  type ActiveMovementInputSource,
} from '../input/composeMovementIntents'
import type { PlayerMovementIntent } from '../input/playerMovementIntent'

export interface GameRuntimeIntegrationSnapshot extends GameRuntimeSnapshot {
  readonly movementIntent: PlayerMovementIntent
  readonly activeInputSource: ActiveMovementInputSource
  readonly combatInput: CombatInputSnapshot
}

interface GameRuntimeIntegration {
  readonly runtime: GameRuntime
  readonly snapshot: GameRuntimeIntegrationSnapshot
  readonly attachGameplayInput: (
    surface: HTMLElement,
    resolveAimDirection: AimDirectionResolver,
  ) => void
}

export function useGameRuntime(): GameRuntimeIntegration {
  const saveService = useMemo(
    () =>
      new GameSaveService(
        typeof localStorage === 'undefined'
          ? {
              readRaw: () => null,
              writeRaw: () => undefined,
              clear: () => undefined,
            }
          : new LocalStorageSaveStorage(localStorage),
      ),
    [],
  )
  const runtime = useMemo(() => {
    const next = new GameRuntime()
    const loaded = saveService.load()
    if (loaded.ok) next.applySave(loaded.save)
    next.setPersistHandler(() => {
      saveService.save(next.captureSave())
    })
    return next
  }, [saveService])
  const combatInputRef = useRef<BrowserAttackInput | null>(null)
  const keyboardInputRef = useRef<BrowserMovementInput | null>(null)
  const pendingGameplayInputRef = useRef<{
    surface: HTMLElement
    resolveAimDirection: AimDirectionResolver
  } | null>(null)
  const [snapshot, setSnapshot] = useState<GameRuntimeIntegrationSnapshot>(
    () => ({
      ...runtime.snapshot(),
      movementIntent: { horizontal: 0, forward: 0 },
      activeInputSource: 'none',
      combatInput: neutralCombatInputSnapshot(),
    }),
  )

  const attachGameplayInput = useCallback(
    (surface: HTMLElement, resolveAimDirection: AimDirectionResolver): void => {
      pendingGameplayInputRef.current = { surface, resolveAimDirection }
      combatInputRef.current?.disconnect()
      const keyboardInput = keyboardInputRef.current
      if (keyboardInput === null) return
      const combatInput = new BrowserAttackInput(
        surface,
        window,
        document,
        resolveAimDirection,
        () => keyboardInput.reset(),
      )
      combatInput.connect()
      combatInputRef.current = combatInput
    },
    [],
  )

  useEffect(() => {
    const keyboardInput = new BrowserMovementInput(window, document)
    const gamepadInput = new BrowserGamepadInput(window, document)
    let previousFrameTime = performance.now()
    let animationFrameId = 0
    let framesSinceProjection = 0

    keyboardInput.connect()
    keyboardInputRef.current = keyboardInput
    gamepadInput.connect()
    const pendingGameplayInput = pendingGameplayInputRef.current
    if (pendingGameplayInput !== null) {
      const combatInput = new BrowserAttackInput(
        pendingGameplayInput.surface,
        window,
        document,
        pendingGameplayInput.resolveAimDirection,
        () => keyboardInput.reset(),
      )
      combatInput.connect()
      combatInputRef.current = combatInput
    }

    const advanceFrame = (frameTime: number): void => {
      const frameDeltaSeconds = Math.max(
        0,
        (frameTime - previousFrameTime) / 1_000,
      )
      previousFrameTime = frameTime
      let composed = composeMovementIntents(
        keyboardInput.movementIntent(),
        gamepadInput.movementIntent(),
      )
      const combatInput = combatInputRef.current
      const respawnRequest = combatInput?.consumeRespawnRequest() ?? null
      if (respawnRequest !== null) {
        const result = runtime.requestRespawn(respawnRequest)
        if (result.accepted) {
          keyboardInput.reset()
          gamepadInput.reset()
          combatInput?.reset()
          composed = composeMovementIntents(
            keyboardInput.movementIntent(),
            gamepadInput.movementIntent(),
          )
        }
      }
      const attackRequest = combatInput?.consumeAttackRequest() ?? null
      const dodgeRequest = combatInput?.consumeDodgeRequest() ?? null
      const worldInteractionRequest =
        combatInput?.consumeWorldInteractionRequest() ?? null
      const flaskRequest = combatInput?.consumeFlaskUseRequest() ?? null
      const skillRequest = combatInput?.consumeSkillUseRequest() ?? null
      if (worldInteractionRequest !== null) {
        runtime.requestWorldInteraction(worldInteractionRequest)
      }
      runtime.setGuardIntent(combatInput?.guardHeld() ?? false)
      if (attackRequest !== null) {
        runtime.requestPlayerAttack(attackRequest)
      }
      if (dodgeRequest !== null) {
        runtime.requestPlayerDodge(dodgeRequest, composed.intent)
      }
      if (flaskRequest !== null) {
        runtime.requestPlayerFlaskUse(flaskRequest)
      }
      if (skillRequest !== null) {
        runtime.requestPlayerSkillUse(skillRequest, composed.intent)
      }
      const snapshot = runtime.advanceFrame(
        frameDeltaSeconds,
        composed.intent,
      )

      // Keep simulation every frame; throttle React panel updates to cut sustained-input jank.
      framesSinceProjection += 1
      if (framesSinceProjection >= 6) {
        framesSinceProjection = 0
        setSnapshot({
          ...snapshot,
          movementIntent: composed.intent,
          activeInputSource: composed.source,
          combatInput: combatInput?.snapshot() ?? neutralCombatInputSnapshot(),
        })
      }
      animationFrameId = requestAnimationFrame(advanceFrame)
    }

    animationFrameId = requestAnimationFrame(advanceFrame)

    return () => {
      cancelAnimationFrame(animationFrameId)
      keyboardInput.disconnect()
      keyboardInputRef.current = null
      gamepadInput.disconnect()
      combatInputRef.current?.disconnect()
      combatInputRef.current = null
    }
  }, [runtime])

  return {
    runtime,
    snapshot,
    attachGameplayInput,
  }
}

function neutralCombatInputSnapshot(): CombatInputSnapshot {
  return {
    primaryButtonHeld: false,
    guardHeld: false,
    dodgeKeyHeld: false,
    checkpointKeyHeld: false,
    respawnKeyHeld: false,
    flaskKeyHeld: false,
    skillKeyHeld: false,
    pendingAttack: false,
    pendingDodge: false,
    pendingCheckpointInteraction: false,
    pendingRespawn: false,
    pendingFlaskUse: false,
    pendingSkillUse: false,
  }
}
