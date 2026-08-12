import { describe, expect, it } from 'vitest'
import { defineCombatAction } from '../combat/combatAction'
import { defineEnemy } from './enemyDefinition'
import { EnemyRuntime } from './enemyRuntime'

const ATTACK = defineCombatAction({
  id: 'enemy.test.attack',
  startupSteps: 2,
  activeSteps: 1,
  recoverySteps: 2,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'never',
  contactWindowId: 'enemy.test.contact',
  cooldownSteps: 0,
})

const DEFINITION = defineEnemy({
  id: 'enemy.test.melee',
  role: 'skirmisher',
  tags: ['grounded', 'melee'],
  body: { radius: 0.35, halfHeight: 0.45 },
  hurtbox: { id: 'hurtbox', kind: 'sphere', offset: { x: 0, y: 0, z: 0 }, radius: 0.45 },
  maximumHealth: 50,
  movementSpeed: 2,
  perceptionRange: 5,
  stoppingRange: 1,
  attackRange: 1.4,
  attackActionIds: [ATTACK.id],
  echoReward: 10,
  xpReward: 10,
})

function createRuntime(id = 'enemy.test.1') {
  return new EnemyRuntime(DEFINITION, id, { x: 1, y: 0.8, z: 2 }, [ATTACK])
}

describe('enemy runtime authority', () => {
  it('keeps immutable authored data separate from deterministic instance state', () => {
    const first = createRuntime('enemy.1')
    const second = createRuntime('enemy.2')

    expect(Object.isFrozen(DEFINITION)).toBe(true)
    expect(Object.isFrozen(DEFINITION.hurtbox)).toBe(true)
    expect(first.definition).toBe(DEFINITION)
    expect(first.snapshot()).toMatchObject({
      id: 'enemy.1',
      definitionId: DEFINITION.id,
      state: 'idle',
      health: { maximum: 50, current: 50, alive: true },
      targetId: null,
    })
    expect(second.snapshot().id).toBe('enemy.2')
    expect(first.snapshot().hurtbox.ownerId).toBe('enemy.1')
  })

  it('owns explicit state and action progression', () => {
    const runtime = createRuntime()
    runtime.transition('pursue', 'player')
    expect(runtime.startAction(ATTACK.id, { x: -1, z: 0 })).toMatchObject({ accepted: true })
    expect(runtime.snapshot()).toMatchObject({
      state: 'attack',
      targetId: 'player',
      facing: { x: -1, z: 0 },
      attackExecutionFacing: { x: -1, z: 0 },
    })
    expect(runtime.snapshot().action.phase).toBe('startup')

    runtime.advanceAction()
    runtime.advanceAction()
    expect(runtime.snapshot().action.phase).toBe('active')
    runtime.advanceAction()
    expect(runtime.snapshot()).toMatchObject({ state: 'recovery' })
    runtime.advanceAction()
    runtime.advanceAction()
    expect(runtime.snapshot()).toMatchObject({
      state: 'spacing',
      action: { phase: 'idle' },
      attackExecutionFacing: null,
    })
  })

  it('applies clamped damage and defeat halts action authority', () => {
    const runtime = createRuntime()
    runtime.transition('pursue', 'player')
    runtime.startAction(ATTACK.id, { x: 0, z: -1 })

    expect(runtime.applyDamage(80)).toMatchObject({ applied: true, appliedDamage: 50 })
    expect(runtime.snapshot()).toMatchObject({
      state: 'defeated',
      alive: false,
      health: { current: 0 },
      targetId: null,
      action: { phase: 'idle' },
    })
    expect(runtime.applyDamage(1)).toMatchObject({ applied: false, appliedDamage: 0 })
    runtime.advanceAction()
    expect(runtime.snapshot().state).toBe('defeated')
  })

  it('rejects forbidden and dead-state transitions', () => {
    const runtime = createRuntime()
    expect(() => runtime.transition('attack', 'player')).toThrow('Forbidden enemy transition')
    runtime.applyDamage(50)
    expect(runtime.startAction(ATTACK.id, { x: 0, z: -1 })).toMatchObject({
      accepted: false,
      reason: 'actor-defeated',
    })
    expect(() => runtime.transition('idle')).toThrow('Forbidden enemy transition')
  })

  it('requires every referenced authored attack definition', () => {
    expect(() => new EnemyRuntime(DEFINITION, 'enemy.1', { x: 0, y: 0, z: 0 }, [])).toThrow(
      'Missing enemy attack definition',
    )
  })
})
