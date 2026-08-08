import { describe, expect, it } from 'vitest'
import { FixedStepClock } from '../core/fixedStepClock'
import { defineCombatAction, type CombatActionDefinition } from './combatAction'
import { CombatActionRuntime } from './combatActionRuntime'

const TEST_ACTION = defineCombatAction({
  id: 'test.light-attack',
  startupSteps: 2,
  activeSteps: 3,
  recoverySteps: 2,
  resourceCost: { resourceId: 'resolve', amount: 10 },
  cancellationPolicy: 'recovery-only',
  interruptibilityPolicy: 'always',
  contactWindowId: 'test.light-contact',
  cooldownSteps: 0,
})

function createRuntime(
  definition: CombatActionDefinition = TEST_ACTION,
): CombatActionRuntime {
  return new CombatActionRuntime([definition])
}

function start(runtime: CombatActionRuntime): void {
  expect(
    runtime.request(
      { type: 'start-action', actionId: TEST_ACTION.id },
      () => ({ allowed: true }),
    ),
  ).toMatchObject({ accepted: true, actionId: TEST_ACTION.id })
}

function advance(runtime: CombatActionRuntime, steps: number): void {
  for (let step = 0; step < steps; step += 1) {
    runtime.advanceFixedStep()
  }
}

describe('CombatActionRuntime', () => {
  it('assigns deterministic identities to separate action executions', () => {
    const runtime = new CombatActionRuntime([TEST_ACTION])
    const first = runtime.request({
      type: 'start-action',
      actionId: TEST_ACTION.id,
    })
    advance(
      runtime,
      TEST_ACTION.startupSteps +
        TEST_ACTION.activeSteps +
        TEST_ACTION.recoverySteps,
    )
    const second = runtime.request({
      type: 'start-action',
      actionId: TEST_ACTION.id,
    })

    expect(first).toMatchObject({ accepted: true, executionId: 1 })
    expect(second).toMatchObject({ accepted: true, executionId: 2 })
    expect(runtime.snapshot().executionId).toBe(2)
  })

  it('starts in startup and follows exact fixed-step phase boundaries', () => {
    const runtime = createRuntime()
    start(runtime)

    expect(runtime.snapshot()).toMatchObject({
      phase: 'startup',
      phaseElapsedSteps: 0,
      phaseRemainingSteps: 2,
      totalElapsedSteps: 0,
    })

    advance(runtime, 1)
    expect(runtime.snapshot()).toMatchObject({
      phase: 'startup',
      phaseElapsedSteps: 1,
      phaseRemainingSteps: 1,
    })

    advance(runtime, 1)
    expect(runtime.snapshot()).toMatchObject({
      phase: 'active',
      phaseElapsedSteps: 0,
      phaseRemainingSteps: 3,
      totalElapsedSteps: 2,
    })

    advance(runtime, 3)
    expect(runtime.snapshot()).toMatchObject({
      phase: 'recovery',
      phaseElapsedSteps: 0,
      phaseRemainingSteps: 2,
      totalElapsedSteps: 5,
    })

    advance(runtime, 2)
    expect(runtime.snapshot()).toMatchObject({
      actionId: null,
      phase: 'idle',
      phaseElapsedSteps: 0,
      phaseRemainingSteps: 0,
      totalElapsedSteps: 0,
    })
  })

  it('progresses equivalently under different render-delta patterns', () => {
    const runPattern = (frameDeltas: readonly number[]) => {
      const runtime = createRuntime()
      const clock = new FixedStepClock()
      start(runtime)
      for (const frameDelta of frameDeltas) {
        clock.advance(frameDelta, () => runtime.advanceFixedStep())
      }
      return runtime.snapshot()
    }

    expect(runPattern(Array.from({ length: 12 }, () => 1 / 120))).toEqual(
      runPattern(Array.from({ length: 3 }, () => 1 / 30)),
    )
  })

  it('rejects a second start while an action is authoritative', () => {
    const runtime = createRuntime()
    start(runtime)

    expect(
      runtime.request({ type: 'start-action', actionId: TEST_ACTION.id }),
    ).toEqual({
      accepted: false,
      actionId: TEST_ACTION.id,
      reason: 'action-in-progress',
    })
  })

  it('allows contact only during the declared active window', () => {
    const runtime = createRuntime()
    start(runtime)
    expect(runtime.snapshot().contact.enabled).toBe(false)

    advance(runtime, TEST_ACTION.startupSteps)
    expect(runtime.snapshot().contact).toEqual({
      enabled: true,
      actionId: TEST_ACTION.id,
      windowId: TEST_ACTION.contactWindowId,
    })

    advance(runtime, TEST_ACTION.activeSteps)
    expect(runtime.snapshot().contact.enabled).toBe(false)
  })

  it('blocks voluntary startup cancellation but permits declared recovery cancellation', () => {
    const runtime = createRuntime()
    start(runtime)

    expect(runtime.requestCancellation()).toEqual({
      accepted: false,
      reason: 'policy-blocked',
    })

    advance(runtime, TEST_ACTION.startupSteps + TEST_ACTION.activeSteps)
    expect(runtime.requestCancellation()).toEqual({
      accepted: true,
      actionId: TEST_ACTION.id,
    })
    expect(runtime.snapshot().phase).toBe('idle')
  })

  it('applies forced interruption through its separate policy', () => {
    const runtime = createRuntime()
    start(runtime)

    expect(runtime.requestInterruption()).toEqual({
      accepted: true,
      actionId: TEST_ACTION.id,
    })
    expect(runtime.snapshot().phase).toBe('idle')
  })

  it('rejects unavailable resources without starting an action', () => {
    const runtime = createRuntime()

    expect(
      runtime.request(
        { type: 'start-action', actionId: TEST_ACTION.id },
        () => ({ allowed: false, reason: 'not enough resolve' }),
      ),
    ).toEqual({
      accepted: false,
      actionId: TEST_ACTION.id,
      reason: 'resource-unavailable',
      detail: 'not enough resolve',
    })
    expect(runtime.snapshot().phase).toBe('idle')
  })

  it('can start a completed action again', () => {
    const runtime = createRuntime()
    start(runtime)
    advance(
      runtime,
      TEST_ACTION.startupSteps +
        TEST_ACTION.activeSteps +
        TEST_ACTION.recoverySteps,
    )

    start(runtime)
    expect(runtime.snapshot().phase).toBe('startup')
  })

  it('reset clears action and cooldown lifecycle state', () => {
    const cooldownAction = defineCombatAction({
      ...TEST_ACTION,
      id: 'test.cooldown-action',
      resourceCost: null,
      cooldownSteps: 5,
    })
    const runtime = createRuntime(cooldownAction)
    expect(
      runtime.request({ type: 'start-action', actionId: cooldownAction.id }),
    ).toMatchObject({ accepted: true })
    advance(
      runtime,
      cooldownAction.startupSteps +
        cooldownAction.activeSteps +
        cooldownAction.recoverySteps,
    )
    expect(
      runtime.request({ type: 'start-action', actionId: cooldownAction.id }),
    ).toMatchObject({ accepted: false, reason: 'cooldown-active' })

    runtime.reset()
    expect(
      runtime.request({ type: 'start-action', actionId: cooldownAction.id }),
    ).toMatchObject({ accepted: true })
  })
})
