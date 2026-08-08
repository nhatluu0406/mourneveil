import { describe, expect, it, vi } from 'vitest'
import { CombatActionRuntime } from './combatActionRuntime'
import {
  CombatContactRuntime,
  type CombatContactQuery,
} from './combatContact'
import {
  PLAYER_HEAVY_ATTACK,
  PLAYER_LIGHT_ATTACK,
  createPlayerAttackSpatialSnapshot,
  type PlayerAttackDefinition,
} from './playerAttackActions'
import {
  TrainingTargetRuntime,
  defineTrainingTarget,
} from './trainingTarget'

const PLAYER_POSITION = { x: 0, y: 0.82, z: 0 }
const PLAYER_FACING = { x: 0, z: -1 }

const overlapAll: CombatContactQuery = ({ hurtboxes }) =>
  hurtboxes.map((hurtbox) => ({
    hurtboxId: hurtbox.id,
    targetId: hurtbox.ownerId,
  }))

function beginAttack(attack: PlayerAttackDefinition): CombatActionRuntime {
  const runtime = new CombatActionRuntime([attack.action])
  runtime.request({ type: 'start-action', actionId: attack.action.id })
  advance(runtime, attack.action.startupSteps)
  return runtime
}

function resolve(
  contacts: CombatContactRuntime,
  actions: CombatActionRuntime,
  targets: readonly TrainingTargetRuntime[],
  query: CombatContactQuery = overlapAll,
  simulationStep = 1,
) {
  const combat = actions.snapshot()
  return contacts.resolvePlayerContact({
    combat,
    attack: createPlayerAttackSpatialSnapshot(
      combat,
      PLAYER_POSITION,
      PLAYER_FACING,
    ),
    simulationStep,
    targets,
    query,
  })
}

function advance(runtime: CombatActionRuntime, steps: number): void {
  for (let step = 0; step < steps; step += 1) {
    runtime.advanceFixedStep()
  }
}

function createTarget(id: string, maximumHealth = 100): TrainingTargetRuntime {
  return new TrainingTargetRuntime(
    defineTrainingTarget({
      id,
      position: { x: 0, y: 0.5, z: -1 },
      hurtbox: {
        id: `${id}.hurtbox`,
        ownerId: id,
        kind: 'sphere',
        center: { x: 0, y: 0.5, z: -1 },
        radius: 0.4,
      },
      maximumHealth,
    }),
  )
}

describe('CombatContactRuntime', () => {
  it('damages one overlapping target once across the whole active window', () => {
    const target = createTarget('target.one')
    const actions = beginAttack(PLAYER_LIGHT_ATTACK)
    const contacts = new CombatContactRuntime()
    const events = []

    for (let step = 0; step < PLAYER_LIGHT_ATTACK.action.activeSteps; step += 1) {
      events.push(...resolve(contacts, actions, [target], overlapAll, step + 10))
      actions.advanceFixedStep()
    }

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: 'combat-hit',
      targetId: 'target.one',
      actionId: PLAYER_LIGHT_ATTACK.action.id,
      executionId: 1,
      contactWindowId: PLAYER_LIGHT_ATTACK.contactShape.windowId,
      simulationStep: 10,
      damage: PLAYER_LIGHT_ATTACK.damage,
    })
    expect(target.snapshot().health.current).toBe(
      100 - PLAYER_LIGHT_ATTACK.damage,
    )
    expect(target.snapshot().hitCount).toBe(1)
  })

  it('allows a new execution to hit the same target again', () => {
    const target = createTarget('target.repeat')
    const actions = beginAttack(PLAYER_LIGHT_ATTACK)
    const contacts = new CombatContactRuntime()
    resolve(contacts, actions, [target])
    advance(
      actions,
      PLAYER_LIGHT_ATTACK.action.activeSteps +
        PLAYER_LIGHT_ATTACK.action.recoverySteps,
    )
    actions.request({
      type: 'start-action',
      actionId: PLAYER_LIGHT_ATTACK.action.id,
    })
    advance(actions, PLAYER_LIGHT_ATTACK.action.startupSteps)

    expect(resolve(contacts, actions, [target])).toHaveLength(1)
    expect(target.snapshot().hitCount).toBe(2)
    expect(target.snapshot().health.current).toBe(
      100 - PLAYER_LIGHT_ATTACK.damage * 2,
    )
  })

  it('does not bypass execution dedup when the target fixture resets', () => {
    const target = createTarget('target.reset')
    const actions = beginAttack(PLAYER_LIGHT_ATTACK)
    const contacts = new CombatContactRuntime()
    expect(resolve(contacts, actions, [target])).toHaveLength(1)

    target.reset()

    expect(resolve(contacts, actions, [target])).toEqual([])
    expect(target.snapshot().health.current).toBe(100)
    expect(target.snapshot().hitCount).toBe(0)
  })

  it('hits two separate overlapping targets once in one execution', () => {
    const first = createTarget('target.first')
    const second = createTarget('target.second')
    const actions = beginAttack(PLAYER_HEAVY_ATTACK)
    const contacts = new CombatContactRuntime()

    expect(resolve(contacts, actions, [second, first])).toHaveLength(2)
    expect(first.snapshot().hitCount).toBe(1)
    expect(second.snapshot().hitCount).toBe(1)
  })

  it('does not query or hit outside the active contact window', () => {
    const target = createTarget('target.inactive')
    const actions = new CombatActionRuntime([PLAYER_LIGHT_ATTACK.action])
    const contacts = new CombatContactRuntime()
    const query = vi.fn<CombatContactQuery>(overlapAll)

    actions.request({
      type: 'start-action',
      actionId: PLAYER_LIGHT_ATTACK.action.id,
    })

    expect(resolve(contacts, actions, [target], query)).toEqual([])
    expect(query).not.toHaveBeenCalled()
    expect(target.snapshot().health.current).toBe(100)
  })

  it('does not damage an already-defeated target', () => {
    const target = createTarget('target.defeated', 10)
    const contacts = new CombatContactRuntime()
    const first = beginAttack(PLAYER_LIGHT_ATTACK)
    expect(resolve(contacts, first, [target])).toHaveLength(1)
    expect(target.snapshot().health.alive).toBe(false)

    const second = beginAttack(PLAYER_LIGHT_ATTACK)
    expect(resolve(contacts, second, [target])).toEqual([])
    expect(target.snapshot().health.current).toBe(0)
    expect(target.snapshot().hitCount).toBe(1)
  })

  it('uses the authoritative heavy damage definition', () => {
    const target = createTarget('target.heavy')
    const actions = beginAttack(PLAYER_HEAVY_ATTACK)
    const event = resolve(new CombatContactRuntime(), actions, [target])[0]

    expect(event.damage).toBe(PLAYER_HEAVY_ATTACK.damage)
    expect(event.damage).toBeGreaterThan(PLAYER_LIGHT_ATTACK.damage)
  })
})
