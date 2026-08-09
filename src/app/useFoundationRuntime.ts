import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PlayerRuntime } from '../game/character/playerRuntime'
import type { FoundationRuntimeDiagnostic } from '../game/core/foundationDiagnostic'
import { BrowserAttackInput } from '../input/browserAttackInput'
import type { AimDirectionResolver, CombatInputSnapshot } from '../input/browserAttackInput'
import { BrowserGamepadInput } from '../input/browserGamepadInput'
import { BrowserMovementInput } from '../input/browserMovementInput'
import { composeMovementIntents } from '../input/composeMovementIntents'

interface FoundationRuntimeIntegration {
  readonly runtime: PlayerRuntime
  readonly diagnostic: FoundationRuntimeDiagnostic
  readonly attachGameplayInput: (
    surface: HTMLElement,
    resolveAimDirection: AimDirectionResolver,
  ) => void
}

export function useFoundationRuntime(): FoundationRuntimeIntegration {
  const runtime = useMemo(() => new PlayerRuntime(), [])
  const combatInputRef = useRef<BrowserAttackInput | null>(null)
  const keyboardInputRef = useRef<BrowserMovementInput | null>(null)
  const pendingGameplayInputRef = useRef<{
    surface: HTMLElement
    resolveAimDirection: AimDirectionResolver
  } | null>(null)
  const [diagnostic, setDiagnostic] = useState<FoundationRuntimeDiagnostic>(
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
    let framesSinceDiagnostic = 0

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
      const composed = composeMovementIntents(
        keyboardInput.movementIntent(),
        gamepadInput.movementIntent(),
      )
      const combatInput = combatInputRef.current
      const attackRequest = combatInput?.consumeAttackRequest() ?? null
      const dodgeRequest = combatInput?.consumeDodgeRequest() ?? null
      const checkpointRequest =
        combatInput?.consumeCheckpointInteractionRequest() ?? null
      const respawnRequest = combatInput?.consumeRespawnRequest() ?? null
      if (checkpointRequest !== null) {
        runtime.requestCheckpointInteraction(checkpointRequest)
      }
      if (respawnRequest !== null) {
        const result = runtime.requestRespawn(respawnRequest)
        if (result.accepted) {
          keyboardInput.reset()
          combatInput?.reset()
        }
      }
      runtime.setGuardIntent(combatInput?.guardHeld() ?? false)
      if (attackRequest !== null) {
        runtime.requestPlayerAttack(attackRequest)
      }
      if (dodgeRequest !== null) {
        runtime.requestPlayerDodge(dodgeRequest, composed.intent)
      }
      const snapshot = runtime.advanceFrame(
        frameDeltaSeconds,
        composed.intent,
      )

      // Keep simulation every frame; throttle React panel updates to cut sustained-input jank.
      framesSinceDiagnostic += 1
      if (framesSinceDiagnostic >= 6) {
        framesSinceDiagnostic = 0
        setDiagnostic({
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
    diagnostic,
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
    pendingAttack: false,
    pendingDodge: false,
    pendingCheckpointInteraction: false,
    pendingRespawn: false,
  }
}
