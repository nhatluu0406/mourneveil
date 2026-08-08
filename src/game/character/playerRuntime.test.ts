import { describe, expect, it } from 'vitest'
import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { CharacterCollisionResolver } from './playerMotor'
import { PlayerRuntime } from './playerRuntime'

const resolveOnFlatGround: CharacterCollisionResolver = (
  _position,
  desiredTranslation,
) => ({
  translation: { ...desiredTranslation, y: 0 },
  grounded: true,
})

function advancePattern(
  frameDeltas: readonly number[],
  intent: PlayerMovementIntent,
): PlayerRuntime {
  const runtime = new PlayerRuntime()
  runtime.attachCollisionResolver(resolveOnFlatGround)

  for (const frameDelta of frameDeltas) {
    runtime.advanceFrame(frameDelta, intent)
  }

  return runtime
}

describe('PlayerRuntime', () => {
  it('produces equivalent movement from different render-delta patterns', () => {
    const intent = { horizontal: 0, forward: 1 }
    const manySmallFrames = advancePattern(
      Array.from({ length: 120 }, () => 1 / 120),
      intent,
    )
    const fewerLargeFrames = advancePattern(
      Array.from({ length: 30 }, () => 1 / 30),
      intent,
    )

    expect(manySmallFrames.snapshot()).toEqual(fewerLargeFrames.snapshot())
    expect(manySmallFrames.snapshot().simulation.stepCount).toBe(60)
  })

  it('does not advance the motor until collision authority is attached', () => {
    const runtime = new PlayerRuntime()
    const initialPlayer = runtime.snapshot().player

    runtime.advanceFrame(1 / 30, { horizontal: 1, forward: 0 })

    expect(runtime.snapshot().player).toBe(initialPlayer)
    expect(runtime.snapshot().simulation.stepCount).toBe(2)
  })
})
