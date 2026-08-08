import { useEffect, useMemo, useState } from 'react'
import { PlayerRuntime } from '../game/character/playerRuntime'
import type { FoundationRuntimeDiagnostic } from '../game/core/foundationDiagnostic'
import { BrowserAttackInput } from '../input/browserAttackInput'
import { BrowserGamepadInput } from '../input/browserGamepadInput'
import { BrowserMovementInput } from '../input/browserMovementInput'
import { composeMovementIntents } from '../input/composeMovementIntents'

interface FoundationRuntimeIntegration {
  readonly runtime: PlayerRuntime
  readonly diagnostic: FoundationRuntimeDiagnostic
}

export function useFoundationRuntime(): FoundationRuntimeIntegration {
  const runtime = useMemo(() => new PlayerRuntime(), [])
  const [diagnostic, setDiagnostic] = useState<FoundationRuntimeDiagnostic>(
    () => ({
      ...runtime.snapshot(),
      movementIntent: { horizontal: 0, forward: 0 },
      activeInputSource: 'none',
    }),
  )

  useEffect(() => {
    const keyboardInput = new BrowserMovementInput(window, document)
    const gamepadInput = new BrowserGamepadInput(window, document)
    const attackInput = new BrowserAttackInput(window, document)
    let previousFrameTime = performance.now()
    let animationFrameId = 0
    let framesSinceDiagnostic = 0

    keyboardInput.connect()
    gamepadInput.connect()
    attackInput.connect()

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
      const attackRequest = attackInput.consumeAttackRequest()
      if (attackRequest !== null) {
        runtime.requestPlayerAttack(attackRequest)
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
          simulation: snapshot.simulation,
          player: snapshot.player,
          combat: snapshot.combat,
          attack: snapshot.attack,
          contact: snapshot.contact,
          trainingTarget: snapshot.trainingTarget,
          movementIntent: composed.intent,
          activeInputSource: composed.source,
        })
      }
      animationFrameId = requestAnimationFrame(advanceFrame)
    }

    animationFrameId = requestAnimationFrame(advanceFrame)

    return () => {
      cancelAnimationFrame(animationFrameId)
      keyboardInput.disconnect()
      gamepadInput.disconnect()
      attackInput.disconnect()
    }
  }, [runtime])

  return {
    runtime,
    diagnostic,
  }
}
