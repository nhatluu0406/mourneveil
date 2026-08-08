export const FIXED_STEP_SECONDS = 1 / 60
export const MAX_FRAME_DELTA_SECONDS = 0.25
export const MAX_CATCH_UP_STEPS = 8

const STEP_EPSILON_SECONDS = 1e-10

export interface SimulationTimeSnapshot {
  readonly stepCount: number
  readonly simulationTimeSeconds: number
  readonly accumulatorSeconds: number
}

export interface FixedStepAdvance extends SimulationTimeSnapshot {
  readonly stepsExecuted: number
  readonly acceptedFrameDeltaSeconds: number
  readonly discardedTimeSeconds: number
}

export type SimulationStep = (
  fixedStepSeconds: number,
  nextStepCount: number,
) => void

export class FixedStepClock {
  private accumulatorSeconds = 0
  private stepCount = 0

  advance(frameDeltaSeconds: number, simulateStep: SimulationStep): FixedStepAdvance {
    if (!Number.isFinite(frameDeltaSeconds) || frameDeltaSeconds < 0) {
      throw new RangeError('Frame delta must be a finite, non-negative number')
    }

    const acceptedFrameDeltaSeconds = Math.min(
      frameDeltaSeconds,
      MAX_FRAME_DELTA_SECONDS,
    )
    let discardedTimeSeconds = frameDeltaSeconds - acceptedFrameDeltaSeconds
    this.accumulatorSeconds += acceptedFrameDeltaSeconds

    let stepsExecuted = 0
    while (
      this.accumulatorSeconds + STEP_EPSILON_SECONDS >= FIXED_STEP_SECONDS &&
      stepsExecuted < MAX_CATCH_UP_STEPS
    ) {
      simulateStep(FIXED_STEP_SECONDS, this.stepCount + 1)
      this.accumulatorSeconds -= FIXED_STEP_SECONDS
      this.normalizeAccumulator()
      this.stepCount += 1
      stepsExecuted += 1
    }

    if (this.accumulatorSeconds + STEP_EPSILON_SECONDS >= FIXED_STEP_SECONDS) {
      const discardedWholeSteps = Math.floor(
        (this.accumulatorSeconds + STEP_EPSILON_SECONDS) / FIXED_STEP_SECONDS,
      )
      const discardedBacklogSeconds = discardedWholeSteps * FIXED_STEP_SECONDS
      this.accumulatorSeconds -= discardedBacklogSeconds
      this.normalizeAccumulator()
      discardedTimeSeconds += discardedBacklogSeconds
    }

    return {
      ...this.snapshot(),
      stepsExecuted,
      acceptedFrameDeltaSeconds,
      discardedTimeSeconds,
    }
  }

  snapshot(): SimulationTimeSnapshot {
    return {
      stepCount: this.stepCount,
      simulationTimeSeconds: this.stepCount * FIXED_STEP_SECONDS,
      accumulatorSeconds: this.accumulatorSeconds,
    }
  }

  private normalizeAccumulator(): void {
    if (Math.abs(this.accumulatorSeconds) < STEP_EPSILON_SECONDS) {
      this.accumulatorSeconds = 0
    }
  }
}
