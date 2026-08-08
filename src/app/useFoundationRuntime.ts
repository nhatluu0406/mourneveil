import { useEffect, useState } from 'react'
import { FixedStepClock } from '../game/core/fixedStepClock'
import type { FoundationRuntimeDiagnostic } from '../game/core/foundationDiagnostic'
import { BrowserMovementInput } from '../input/browserMovementInput'

const INITIAL_DIAGNOSTIC: FoundationRuntimeDiagnostic = {
  simulation: {
    stepCount: 0,
    simulationTimeSeconds: 0,
    accumulatorSeconds: 0,
  },
  movementIntent: { horizontal: 0, forward: 0 },
}

export function useFoundationRuntime(): FoundationRuntimeDiagnostic {
  const [diagnostic, setDiagnostic] = useState(INITIAL_DIAGNOSTIC)

  useEffect(() => {
    const clock = new FixedStepClock()
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
      const simulation = clock.advance(frameDeltaSeconds, () => undefined)

      setDiagnostic({
        simulation,
        movementIntent: movementInput.movementIntent(),
      })
      animationFrameId = requestAnimationFrame(advanceFrame)
    }

    animationFrameId = requestAnimationFrame(advanceFrame)

    return () => {
      cancelAnimationFrame(animationFrameId)
      movementInput.disconnect()
    }
  }, [])

  return diagnostic
}
