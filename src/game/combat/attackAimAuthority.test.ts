import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../runtime/GameRuntime'
import type { CharacterCollisionResolver } from '../character/playerMotor'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import { CombatActionRuntime } from './combatActionRuntime'
import {
  PLAYER_HEAVY_ATTACK,
  PLAYER_LIGHT_ATTACK,
  attackContactOverlapsSphere,
  createPlayerAttackSpatialSnapshot,
  transformPlayerAttackContactShape,
} from './playerAttackActions'
import { TRAINING_TARGET_DEFINITION } from './trainingTarget'
import { resolveAttackPresentationFacing } from '../../render/playerAttackPresentation'

const flatGround: CharacterCollisionResolver = (_position, desired) => ({
  translation: { ...desired, y: 0 },
  grounded: true,
})

function advanceToActive(runtime: GameRuntime, attack: 'light' | 'heavy'): void {
  const definition = attack === 'light' ? PLAYER_LIGHT_ATTACK : PLAYER_HEAVY_ATTACK
  for (let step = 0; step < definition.action.startupSteps; step += 1) {
    runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
  }
}

describe('attack aim authority', () => {
  it('snapshots accepted semantic aim for presentation and contact', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(flatGround)
    runtime.requestPlayerAttack({
      type: 'player-attack',
      attack: 'light',
      aimDirection: { x: 0, z: 1 },
    })

    const snapshot = runtime.snapshot()
    expect(snapshot.attack.executionFacing).toEqual({ x: 0, z: 1 })
    expect(
      resolveAttackPresentationFacing(snapshot.attack, snapshot.player),
    ).toEqual({ x: 0, z: 1 })

    advanceToActive(runtime, 'light')
    const active = runtime.snapshot()
    expect(active.attack.activeContactShape?.facing).toEqual({ x: 0, z: 1 })
    expect(active.attack.activeContactShape?.center.z).toBeCloseTo(
      active.player.position.z + PLAYER_LIGHT_ATTACK.contactShape.forwardOffset,
    )
  })

  it('does not rotate an active execution when live facing would change', () => {
    const runtime = new GameRuntime()
    runtime.attachCollisionResolver(flatGround)
    runtime.requestPlayerAttack({
      type: 'player-attack',
      attack: 'light',
      aimDirection: { x: 1, z: 0 },
    })

    // Movement is constrained during the attack; force a rejected re-aim and
    // keep supplying opposite locomotion intent across the committed window.
    runtime.requestPlayerAttack({
      type: 'player-attack',
      attack: 'heavy',
      aimDirection: { x: -1, z: 0 },
    })
    for (let step = 0; step < PLAYER_LIGHT_ATTACK.action.startupSteps + 1; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: -1, forward: 0 })
    }

    const snapshot = runtime.snapshot()
    expect(snapshot.attack.executionFacing).toEqual({ x: 1, z: 0 })
    expect(snapshot.attack.activeContactShape?.facing).toEqual({ x: 1, z: 0 })
    expect(snapshot.player.facing).toEqual({ x: 1, z: 0 })
    expect(
      resolveAttackPresentationFacing(snapshot.attack, {
        facing: { x: -1, z: 0 },
      }),
    ).toEqual({ x: 1, z: 0 })
  })
})

describe('directional contact miss', () => {
  const playerPosition = { ...TRAINING_TARGET_DEFINITION.position, z: 3, y: 0.82 }
  const hurtbox = TRAINING_TARGET_DEFINITION.hurtbox

  it.each([
    ['light', PLAYER_LIGHT_ATTACK] as const,
    ['heavy', PLAYER_HEAVY_ATTACK] as const,
  ])('%s forward attack overlaps the training target', (_name, attack) => {
    const contact = transformPlayerAttackContactShape(
      attack.contactShape,
      playerPosition,
      { x: 0, z: -1 },
    )
    expect(attackContactOverlapsSphere(contact, hurtbox)).toBe(true)
  })

  it.each([
    ['light', PLAYER_LIGHT_ATTACK] as const,
    ['heavy', PLAYER_HEAVY_ATTACK] as const,
  ])('%s opposite-facing attack misses the same target', (_name, attack) => {
    const contact = transformPlayerAttackContactShape(
      attack.contactShape,
      playerPosition,
      { x: 0, z: 1 },
    )
    expect(attackContactOverlapsSphere(contact, hurtbox)).toBe(false)
  })

  it.each([
    ['light', PLAYER_LIGHT_ATTACK] as const,
    ['heavy', PLAYER_HEAVY_ATTACK] as const,
  ])('%s perpendicular-facing attack misses when outside the sphere', (_name, attack) => {
    const contact = transformPlayerAttackContactShape(
      attack.contactShape,
      playerPosition,
      { x: 1, z: 0 },
    )
    expect(attackContactOverlapsSphere(contact, hurtbox)).toBe(false)
  })

  it('keeps contact geometry from reaching behind the player', () => {
    for (const attack of [PLAYER_LIGHT_ATTACK, PLAYER_HEAVY_ATTACK]) {
      expect(attack.contactShape.forwardOffset - attack.contactShape.radius).toBeGreaterThan(
        0.25,
      )
    }
    expect(PLAYER_LIGHT_ATTACK.contactShape.forwardOffset).toBeLessThan(
      PLAYER_HEAVY_ATTACK.contactShape.forwardOffset,
    )
    expect(PLAYER_LIGHT_ATTACK.contactShape.radius).toBeLessThan(
      PLAYER_HEAVY_ATTACK.contactShape.radius,
    )
  })

  it('uses only the frozen execution facing for active contact snapshots', () => {
    const actions = new CombatActionRuntime([PLAYER_LIGHT_ATTACK.action])
    actions.request({
      type: 'start-action',
      actionId: PLAYER_LIGHT_ATTACK.action.id,
    })
    for (let step = 0; step < PLAYER_LIGHT_ATTACK.action.startupSteps; step += 1) {
      actions.advanceFixedStep()
    }

    const withFrozen = createPlayerAttackSpatialSnapshot(
      actions.snapshot(),
      playerPosition,
      { x: 0, z: 1 },
    )
    expect(withFrozen.activeContactShape?.facing).toEqual({ x: 0, z: 1 })
    expect(
      attackContactOverlapsSphere(withFrozen.activeContactShape!, hurtbox),
    ).toBe(false)

    expect(
      createPlayerAttackSpatialSnapshot(actions.snapshot(), playerPosition, null)
        .activeContactShape,
    ).toBeNull()
  })
})
