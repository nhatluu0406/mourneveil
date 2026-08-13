import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GameRuntime,
  type GameRuntimeSnapshot,
} from '../game/runtime/GameRuntime'
import { constructGameSession } from '../game/save/constructGameSession'
import type { GameSaveService } from '../game/save/gameSaveService'
import type { GameSessionIntent } from '../game/save/sessionIntent'
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

export interface GameRuntimeIntegration {
  readonly runtime: GameRuntime | null
  readonly snapshot: GameRuntimeIntegrationSnapshot | null
  readonly attachGameplayInput: (
    surface: HTMLElement,
    resolveAimDirection: AimDirectionResolver,
  ) => void
}

export function useGameRuntime(
  intent: GameSessionIntent | null,
  saveService: GameSaveService,
): GameRuntimeIntegration {
  const runtime = useMemo(() => {
    if (intent === null) return null
    return constructGameSession(intent, saveService)
  }, [intent, saveService])
  const combatInputRef = useRef<BrowserAttackInput | null>(null)
  const keyboardInputRef = useRef<BrowserMovementInput | null>(null)
  const pendingGameplayInputRef = useRef<{
    surface: HTMLElement
    resolveAimDirection: AimDirectionResolver
  } | null>(null)
  const [snapshot, setSnapshot] = useState<GameRuntimeIntegrationSnapshot | null>(null)

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
    if (runtime === null) {
      return
    }
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
      const next = runtime.advanceFrame(
        frameDeltaSeconds,
        composed.intent,
      )

      framesSinceProjection += 1
      if (framesSinceProjection >= 6) {
        framesSinceProjection = 0
        setSnapshot({
          ...next,
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
    snapshot: runtime === null ? null : (snapshot ?? withNeutralInput(runtime.snapshot())),
    attachGameplayInput,
  }
}

function withNeutralInput(snapshot: GameRuntimeSnapshot): GameRuntimeIntegrationSnapshot {
  return {
    ...snapshot,
    movementIntent: { horizontal: 0, forward: 0 },
    activeInputSource: 'none',
    combatInput: neutralCombatInputSnapshot(),
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
