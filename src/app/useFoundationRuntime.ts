import { useEffect, useMemo, useState } from 'react'
import { PlayerRuntime } from '../game/character/playerRuntime'
import type { FoundationRuntimeDiagnostic } from '../game/core/foundationDiagnostic'
import { BrowserMovementInput } from '../input/browserMovementInput'

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
    }),
  )

  useEffect(() => {
    const movementInput = new BrowserMovementInput(window, document)
    let previousFrameTime = performance.now()
    let animationFrameId = 0

    movementInput.connect()

    const advanceFrame = (frameTime: number): void => {
      const frameDeltaSeconds = Math.max(
        0,
        (frameTime - previousFrameTime) / 1_000,
      )
      previousFrameTime = frameTime
      const movementIntent = movementInput.movementIntent()
      const snapshot = runtime.advanceFrame(frameDeltaSeconds, movementIntent)

      setDiagnostic({
        simulation: snapshot.simulation,
        player: snapshot.player,
        movementIntent,
      })
      animationFrameId = requestAnimationFrame(advanceFrame)
    }

    animationFrameId = requestAnimationFrame(advanceFrame)

    return () => {
      cancelAnimationFrame(animationFrameId)
      movementInput.disconnect()
    }
  }, [runtime])

  return { runtime, diagnostic }
}
