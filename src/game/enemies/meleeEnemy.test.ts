import { describe, expect, it } from 'vitest'
import { PlayerCombatHealthRuntime } from '../character/playerCombatHealth'
import type { CharacterCollisionResolver } from '../character/playerMotor'
import { CombatContactRuntime, type CombatContactQuery } from '../combat/combatContact'
import type { PlayerDefenseSnapshot } from '../combat/playerDefense'
import { resolveIncomingMeleeDefense } from '../combat/playerDefense'
import { attackContactOverlapsSphere } from '../combat/playerAttackActions'
import {
  MELEE_ENEMY_ATTACK,
  MELEE_ENEMY_ATTACK_DAMAGE,
  advanceMeleeEnemy,
  createEnemyAttackSpatialSnapshot,
  createMeleeEnemyRuntime,
  horizontalDistance,
} from './meleeEnemy'

const STEP = 1 / 60
const CLOSE_PLAYER = { x: 1.5, y: 0.82, z: 3 } as const
const FLAT_GROUND: CharacterCollisionResolver = (_position, translation) => ({
  translation: { ...translation, y: 0 },
  grounded: true,
})
const GEOMETRIC_QUERY: CombatContactQuery = ({ contactShape, hurtboxes }) =>
  hurtboxes
    .filter((hurtbox) => attackContactOverlapsSphere(contactShape, hurtbox))
    .map((hurtbox) => ({ hurtboxId: hurtbox.id, targetId: hurtbox.ownerId }))

function defense(overrides: Partial<PlayerDefenseSnapshot> = {}): PlayerDefenseSnapshot {
  return {
    guarding: false,
    guardIntentHeld: false,
    movementScale: 1,
    dodgeExecutionId: null,
    dodgeDirection: null,
    dodgeMovementActive: false,
    invulnerable: false,
    ...overrides,
  }
}

function advanceToActive(
  playerPosition: { x: number; y: number; z: number } = CLOSE_PLAYER,
) {
  const enemy = createMeleeEnemyRuntime()
  for (let step = 0; step < 180 && enemy.snapshot().action.phase !== 'startup'; step += 1) {
    advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
  }
  expect(enemy.snapshot().action.phase).toBe('startup')
  for (let step = 0; step < MELEE_ENEMY_ATTACK.startupSteps; step += 1) {
    advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
  }
  expect(enemy.snapshot().action.phase).toBe('active')
  return enemy
}

function resolveIncoming(
  enemy: ReturnType<typeof createMeleeEnemyRuntime>,
  player: PlayerCombatHealthRuntime,
  playerDefense: PlayerDefenseSnapshot,
) {
  const contacts = new CombatContactRuntime()
  const enemySnapshot = enemy.snapshot()
  return contacts.resolveContact({
    attackerId: enemySnapshot.id,
    combat: enemySnapshot.action,
    contactShape: createEnemyAttackSpatialSnapshot(enemySnapshot).activeContactShape,
    simulationStep: 1,
    targets: [player],
    query: GEOMETRIC_QUERY,
    damage: MELEE_ENEMY_ATTACK_DAMAGE,
    resolveDamage: (target, damage) => {
      const outcome = resolveIncomingMeleeDefense(
        playerDefense,
        { x: 1, z: 0 },
        createEnemyAttackSpatialSnapshot(enemySnapshot).executionFacing ?? enemySnapshot.facing,
      )
      return outcome === 'damaged'
        ? { outcome, result: target.applyDamage(damage) }
        : {
            outcome,
            result: {
              applied: false,
              appliedDamage: 0,
              health: target.snapshot().health,
            },
          }
    },
  })
}

describe('first melee enemy behavior', () => {
  it('idles outside detection, pursues at bounded speed, and starts in melee range', () => {
    const enemy = createMeleeEnemyRuntime()
    advanceMeleeEnemy(enemy, { x: -3, y: 0.82, z: 3 }, STEP, FLAT_GROUND)
    expect(enemy.snapshot().state).toBe('idle')

    const before = enemy.snapshot().position
    advanceMeleeEnemy(enemy, { x: 0, y: 0.82, z: 3 }, STEP, FLAT_GROUND)
    const pursuing = enemy.snapshot()
    expect(pursuing.state).toBe('pursue')
    expect(Math.hypot(pursuing.position.x - before.x, pursuing.position.z - before.z)).toBeCloseTo(
      enemy.definition.movementSpeed * STEP,
    )
    expect(pursuing.facing).toEqual({ x: -1, z: 0 })

    advanceMeleeEnemy(enemy, CLOSE_PLAYER, STEP, FLAT_GROUND)
    expect(enemy.snapshot()).toMatchObject({ state: 'attack', action: { phase: 'startup' } })
  })

  it('owns telegraph, active, recovery, and repeat timing in fixed steps', () => {
    const playerPosition = CLOSE_PLAYER
    const enemy = advanceToActive(playerPosition)
    expect(createEnemyAttackSpatialSnapshot(enemy.snapshot()).contactEnabled).toBe(true)

    for (let step = 0; step < MELEE_ENEMY_ATTACK.activeSteps; step += 1) {
      advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
    }
    expect(enemy.snapshot()).toMatchObject({ state: 'recovery', action: { phase: 'recovery' } })
    for (let step = 0; step < MELEE_ENEMY_ATTACK.recoverySteps; step += 1) {
      advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
    }
    expect(enemy.snapshot()).toMatchObject({ state: 'spacing', action: { phase: 'idle' } })
    advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
    expect(enemy.snapshot()).toMatchObject({
      state: 'attack',
      action: { phase: 'startup', executionId: 2 },
    })
  })

  it('halts behavior and outgoing contact after defeat', () => {
    const enemy = advanceToActive()
    enemy.applyDamage(enemy.definition.maximumHealth)
    advanceMeleeEnemy(enemy, CLOSE_PLAYER, STEP, FLAT_GROUND)
    expect(enemy.snapshot()).toMatchObject({ state: 'defeated', action: { phase: 'idle' } })
    expect(createEnemyAttackSpatialSnapshot(enemy.snapshot()).activeContactShape).toBeNull()
  })

  it('snapshots accepted facing and does not rotate when the player moves behind', () => {
    const front = { x: 1.5, y: 0.82, z: 3 }
    const behind = { x: 3.5, y: 0.82, z: 3 }
    const enemy = createMeleeEnemyRuntime()
    advanceMeleeEnemy(enemy, front, STEP, FLAT_GROUND)
    const accepted = enemy.snapshot()

    expect(accepted.attackExecutionFacing).toEqual({ x: -1, z: 0 })
    for (let step = 0; step < MELEE_ENEMY_ATTACK.startupSteps; step += 1) {
      advanceMeleeEnemy(enemy, behind, STEP, FLAT_GROUND)
    }

    const active = enemy.snapshot()
    const attack = createEnemyAttackSpatialSnapshot(active)
    expect(active.attackExecutionFacing).toEqual(accepted.attackExecutionFacing)
    expect(attack.executionFacing).toEqual({ x: -1, z: 0 })
    expect(attack.activeContactShape?.center.x).toBeLessThan(active.position.x)
    const playerBehind = new PlayerCombatHealthRuntime(behind)
    expect(resolveIncoming(enemy, playerBehind, defense())).toEqual([])
  })

  it('snapshots a new player direction for a later execution', () => {
    const firstPosition = { x: 1.5, y: 0.82, z: 3 }
    const secondPosition = { x: 3.5, y: 0.82, z: 3 }
    const enemy = createMeleeEnemyRuntime()
    advanceMeleeEnemy(enemy, firstPosition, STEP, FLAT_GROUND)
    expect(enemy.snapshot().attackExecutionFacing).toEqual({ x: -1, z: 0 })

    for (
      let step = 0;
      step <
      MELEE_ENEMY_ATTACK.startupSteps +
        MELEE_ENEMY_ATTACK.activeSteps +
        MELEE_ENEMY_ATTACK.recoverySteps;
      step += 1
    ) advanceMeleeEnemy(enemy, secondPosition, STEP, FLAT_GROUND)
    advanceMeleeEnemy(enemy, secondPosition, STEP, FLAT_GROUND)

    expect(enemy.snapshot()).toMatchObject({
      state: 'attack',
      attackExecutionFacing: { x: 1, z: 0 },
      action: { executionId: 2, phase: 'startup' },
    })
  })

  it('holds authored spacing hysteresis without pursue/attack threshold flapping', () => {
    const enemy = createMeleeEnemyRuntime()
    const close = { x: 1.5, y: 0.82, z: 3 }
    advanceMeleeEnemy(enemy, close, STEP, FLAT_GROUND)
    for (
      let step = 0;
      step <
      MELEE_ENEMY_ATTACK.startupSteps +
        MELEE_ENEMY_ATTACK.activeSteps +
        MELEE_ENEMY_ATTACK.recoverySteps;
      step += 1
    ) advanceMeleeEnemy(enemy, close, STEP, FLAT_GROUND)

    const heldPosition = enemy.snapshot().position
    const hysteresisBand = {
      x: heldPosition.x -
        (enemy.definition.stoppingRange + enemy.definition.attackRange) / 2,
      y: heldPosition.y,
      z: heldPosition.z,
    }
    for (let step = 0; step < 20; step += 1) {
      advanceMeleeEnemy(enemy, hysteresisBand, STEP, FLAT_GROUND)
      expect(enemy.snapshot().state).toBe('spacing')
      expect(enemy.snapshot().position).toEqual(heldPosition)
    }

    advanceMeleeEnemy(
      enemy,
      {
        x: heldPosition.x - enemy.definition.attackRange - 0.1,
        y: heldPosition.y,
        z: heldPosition.z,
      },
      STEP,
      FLAT_GROUND,
    )
    expect(enemy.snapshot().state).toBe('pursue')
  })

  it('clamps pursuit at authored stand-off and stays finite at zero distance', () => {
    const enemy = createMeleeEnemyRuntime()
    const playerPosition = { x: 0, y: 0.82, z: 3 }
    for (let step = 0; step < 120; step += 1) {
      advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
      if (enemy.snapshot().state === 'attack') break
    }
    expect(horizontalDistance(enemy.snapshot().position, playerPosition)).toBeCloseTo(
      enemy.definition.stoppingRange,
    )

    const coincident = createMeleeEnemyRuntime()
    advanceMeleeEnemy(coincident, coincident.snapshot().position, STEP, FLAT_GROUND)
    expect(Object.values(coincident.snapshot().facing).every(Number.isFinite)).toBe(true)
    expect(coincident.snapshot().attackExecutionFacing).toEqual({ x: -1, z: 0 })
  })
})

describe('enemy outgoing contact and player defense', () => {
  it('misses outside range and with wrong-facing execution', () => {
    const enemy = advanceToActive()
    const outside = new PlayerCombatHealthRuntime({ x: -1, y: 0.82, z: 3 })
    expect(resolveIncoming(enemy, outside, defense())).toEqual([])

    const wrongFacing = createMeleeEnemyRuntime()
    wrongFacing.transition('pursue', 'player')
    wrongFacing.startAction(MELEE_ENEMY_ATTACK.id, { x: 1, z: 0 })
    for (let step = 0; step < MELEE_ENEMY_ATTACK.startupSteps; step += 1) {
      wrongFacing.advanceAction()
    }
    const player = new PlayerCombatHealthRuntime(CLOSE_PLAYER)
    expect(resolveIncoming(wrongFacing, player, defense())).toEqual([])
  })

  it('damages once per execution and permits a new execution to hit again', () => {
    const playerPosition = CLOSE_PLAYER
    const enemy = advanceToActive(playerPosition)
    const player = new PlayerCombatHealthRuntime(playerPosition)
    const contacts = new CombatContactRuntime()

    const resolve = () => {
      const snapshot = enemy.snapshot()
      return contacts.resolveContact({
        attackerId: snapshot.id,
        combat: snapshot.action,
        contactShape: createEnemyAttackSpatialSnapshot(snapshot).activeContactShape,
        simulationStep: 1,
        targets: [player],
        query: GEOMETRIC_QUERY,
        damage: MELEE_ENEMY_ATTACK_DAMAGE,
      })
    }
    expect(resolve()).toHaveLength(1)
    expect(resolve()).toEqual([])
    expect(player.snapshot().health.current).toBe(90)

    for (
      let step = 0;
      step < MELEE_ENEMY_ATTACK.activeSteps + MELEE_ENEMY_ATTACK.recoverySteps;
      step += 1
    ) advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
    advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
    for (let step = 0; step < MELEE_ENEMY_ATTACK.startupSteps; step += 1) {
      advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
    }
    expect(resolve()).toHaveLength(1)
    expect(player.snapshot().health.current).toBe(80)
  })

  it('applies normal damage, dodge invulnerability, and directional guard policy', () => {
    const playerPosition = CLOSE_PLAYER

    const normal = new PlayerCombatHealthRuntime(playerPosition)
    expect(resolveIncoming(advanceToActive(playerPosition), normal, defense())[0]).toMatchObject({
      outcome: 'damaged',
      appliedDamage: MELEE_ENEMY_ATTACK_DAMAGE,
    })
    expect(normal.snapshot().health.current).toBe(90)

    const dodging = new PlayerCombatHealthRuntime(playerPosition)
    expect(
      resolveIncoming(
        advanceToActive(playerPosition),
        dodging,
        defense({ invulnerable: true }),
      )[0],
    ).toMatchObject({ outcome: 'dodged', appliedDamage: 0 })
    expect(dodging.snapshot().health.current).toBe(100)

    const guarding = new PlayerCombatHealthRuntime(playerPosition)
    expect(
      resolveIncoming(
        advanceToActive(playerPosition),
        guarding,
        defense({ guarding: true, movementScale: 0.35 }),
      )[0],
    ).toMatchObject({ outcome: 'guarded', appliedDamage: 0 })
    expect(guarding.snapshot().health.current).toBe(100)

    const rearPosition = { x: 3.5, y: 0.82, z: 3 }
    const rear = new PlayerCombatHealthRuntime(rearPosition)
    const rearEnemy = advanceToActive(rearPosition)
    expect(resolveIncoming(rearEnemy, rear, defense({ guarding: true }))[0]).toMatchObject({
      outcome: 'damaged',
      appliedDamage: MELEE_ENEMY_ATTACK_DAMAGE,
    })
  })

  it('keeps advancing attack/recovery after the target dies and exits to idle', () => {
    const playerPosition = { x: 1.3, y: 0.82, z: 3 }
    const enemy = advanceToActive(playerPosition)
    expect(enemy.snapshot().state).toBe('attack')

    for (let step = 0; step < 200; step += 1) {
      advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND, { targetAlive: false })
      const snapshot = enemy.snapshot()
      if (snapshot.state === 'idle') {
        expect(snapshot.action.phase).toBe('idle')
        expect(snapshot.targetId).toBeNull()
        expect(snapshot.attackExecutionFacing).toBeNull()
        return
      }
      expect(['attack', 'recovery', 'spacing']).toContain(snapshot.state)
    }
    throw new Error('Enemy remained in a non-idle state after target death')
  })

  it('escapes pursue soft-lock when collision returns a near-zero step inside attack range', () => {
    const farPlayer = { x: -1, y: 0.82, z: 3 }
    const enemy = createMeleeEnemyRuntime()
    advanceMeleeEnemy(enemy, farPlayer, STEP, FLAT_GROUND)
    expect(enemy.snapshot().state).toBe('pursue')

    const nearPlayer = { x: 1.35, y: 0.82, z: 3 }
    const blocked: CharacterCollisionResolver = () => ({
      translation: { x: 0, y: 0, z: 0 },
      grounded: true,
    })
    advanceMeleeEnemy(enemy, nearPlayer, STEP, blocked)
    const snapshot = enemy.snapshot()
    expect(['spacing', 'attack']).toContain(snapshot.state)
    expect(snapshot.state).not.toBe('pursue')
  })

  it('completes multiple attack cycles without trapping in a non-terminal dead-end', () => {
    const playerPosition = CLOSE_PLAYER
    const enemy = createMeleeEnemyRuntime()
    let attackStarts = 0
    let previousPhase: string | null = null

    for (let step = 0; step < 600; step += 1) {
      advanceMeleeEnemy(enemy, playerPosition, STEP, FLAT_GROUND)
      const snapshot = enemy.snapshot()
      expect(snapshot.alive).toBe(true)
      expect(snapshot.state).not.toBe('defeated')
      if (
        snapshot.state === 'attack' &&
        snapshot.action.phase === 'startup' &&
        previousPhase !== 'startup'
      ) {
        attackStarts += 1
      }
      previousPhase = snapshot.action.phase
    }

    expect(attackStarts).toBeGreaterThanOrEqual(2)
    expect(['spacing', 'attack', 'recovery']).toContain(enemy.snapshot().state)
  })
})
