import type { CombatActionDefinition, CombatActionId } from '../combat/combatAction'
import type { PlayerFacingDirection, Vector3Value } from '../character/playerMotor'
import { defineCombatAction } from '../combat/combatAction'
import { defineEnemy, type EnemyDefinition, type EnemyRole } from './enemyDefinition'
import { EnemyRuntime } from './enemyRuntime'

export interface EnemyMeleeContactShape {
  readonly id: string
  readonly kind: 'sphere'
  readonly actionId: CombatActionId
  readonly windowId: string
  readonly forwardOffset: number
  readonly radius: number
}

export interface EnemyPresentationDefinition {
  readonly primaryColor: string
  readonly telegraphColor: string
  readonly contactColor: string
  readonly bodyScale: number
  readonly animation: EnemyAnimationPresentationDefinition
}

export interface EnemyAnimationPresentationDefinition {
  readonly idleAmplitude: number
  readonly locomotionCadence: number
  readonly attackAnticipation: number
  readonly attackSwing: number
  readonly recoveryWeight: number
  readonly hitRecoil: number
}

export interface EnemyMeleeRoleSpec {
  readonly runtimeId: string
  readonly role: EnemyRole
  readonly definition: EnemyDefinition
  readonly attack: CombatActionDefinition
  readonly damage: number
  readonly contact: EnemyMeleeContactShape
  readonly spawnPosition: Vector3Value
  readonly initialFacing: PlayerFacingDirection
  readonly presentation: EnemyPresentationDefinition
}

export const SKIRMISHER_ATTACK = defineCombatAction({
  id: 'enemy.skirmisher.attack',
  startupSteps: 18,
  activeSteps: 5,
  recoverySteps: 18,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'never',
  contactWindowId: 'enemy.skirmisher.attack.contact',
  cooldownSteps: 0,
})

export const BRUTE_ATTACK = defineCombatAction({
  id: 'enemy.brute.attack',
  startupSteps: 42,
  activeSteps: 8,
  recoverySteps: 36,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'never',
  contactWindowId: 'enemy.brute.attack.contact',
  cooldownSteps: 0,
})

export const SKIRMISHER_ROLE: EnemyMeleeRoleSpec = Object.freeze({
  runtimeId: 'enemy.skirmisher.1',
  role: 'skirmisher',
  definition: defineEnemy({
    id: 'enemy.skirmisher.graybox',
    role: 'skirmisher',
    tags: ['grounded', 'melee', 'skirmisher'],
    body: { radius: 0.3, halfHeight: 0.4 },
    hurtbox: {
      id: 'hurtbox',
      kind: 'sphere',
      offset: { x: 0, y: 0, z: 0 },
      radius: 0.4,
    },
    maximumHealth: 70,
    movementSpeed: 2.85,
    perceptionRange: 5,
    stoppingRange: 1.05,
    attackRange: 1.28,
    attackActionIds: [SKIRMISHER_ATTACK.id],
    echoReward: 25,
  }),
  attack: SKIRMISHER_ATTACK,
  damage: 10,
  contact: Object.freeze({
    id: 'enemy.skirmisher.attack.sphere',
    kind: 'sphere',
    actionId: SKIRMISHER_ATTACK.id,
    windowId: SKIRMISHER_ATTACK.contactWindowId!,
    forwardOffset: 0.7,
    radius: 0.44,
  }),
  spawnPosition: Object.freeze({ x: 2.5, y: 0.82, z: 3 }),
  initialFacing: Object.freeze({ x: -1, z: 0 }),
  presentation: Object.freeze({
    primaryColor: '#5f8f78',
    telegraphColor: '#7dffb0',
    contactColor: '#ff6b5c',
    bodyScale: 0.92,
    animation: Object.freeze({
      idleAmplitude: 0.018,
      locomotionCadence: 0.19,
      attackAnticipation: 0.28,
      attackSwing: 0.48,
      recoveryWeight: 0.18,
      hitRecoil: 0.2,
    }),
  }),
})

export const BRUTE_ROLE: EnemyMeleeRoleSpec = Object.freeze({
  runtimeId: 'enemy.brute.1',
  role: 'brute',
  definition: defineEnemy({
    id: 'enemy.brute.graybox',
    role: 'brute',
    tags: ['grounded', 'melee', 'brute'],
    body: { radius: 0.48, halfHeight: 0.55 },
    hurtbox: {
      id: 'hurtbox',
      kind: 'sphere',
      offset: { x: 0, y: 0, z: 0 },
      radius: 0.58,
    },
    maximumHealth: 160,
    movementSpeed: 1.4,
    perceptionRange: 4.2,
    stoppingRange: 1.45,
    attackRange: 1.75,
    attackActionIds: [BRUTE_ATTACK.id],
    echoReward: 60,
  }),
  attack: BRUTE_ATTACK,
  damage: 28,
  contact: Object.freeze({
    id: 'enemy.brute.attack.sphere',
    kind: 'sphere',
    actionId: BRUTE_ATTACK.id,
    windowId: BRUTE_ATTACK.contactWindowId!,
    forwardOffset: 0.95,
    radius: 0.68,
  }),
  spawnPosition: Object.freeze({ x: -3.1, y: 0.82, z: -3.0 }),
  initialFacing: Object.freeze({ x: 1, z: 0 }),
  presentation: Object.freeze({
    primaryColor: '#8a4f3d',
    telegraphColor: '#ff9d4d',
    contactColor: '#ff574d',
    bodyScale: 1.18,
    animation: Object.freeze({
      idleAmplitude: 0.009,
      locomotionCadence: 0.105,
      attackAnticipation: 0.5,
      attackSwing: 0.72,
      recoveryWeight: 0.32,
      hitRecoil: 0.12,
    }),
  }),
})

export const GRAYBOX_ENEMY_ROLES: readonly EnemyMeleeRoleSpec[] = Object.freeze([
  SKIRMISHER_ROLE,
  BRUTE_ROLE,
])

const PROFILES_BY_ACTION = new Map<CombatActionId, EnemyMeleeRoleSpec>(
  GRAYBOX_ENEMY_ROLES.map((role) => [role.attack.id, role]),
)

const SPECS_BY_RUNTIME_ID = new Map<string, EnemyMeleeRoleSpec>(
  GRAYBOX_ENEMY_ROLES.map((role) => [role.runtimeId, role]),
)

const SPECS_BY_DEFINITION_ID = new Map<string, EnemyMeleeRoleSpec>(
  GRAYBOX_ENEMY_ROLES.map((role) => [role.definition.id, role]),
)

export function meleeRoleByActionId(actionId: CombatActionId | null): EnemyMeleeRoleSpec | null {
  if (actionId === null) return null
  return PROFILES_BY_ACTION.get(actionId) ?? null
}

export function meleeRoleByRuntimeId(runtimeId: string): EnemyMeleeRoleSpec | null {
  return SPECS_BY_RUNTIME_ID.get(runtimeId) ?? null
}

export function meleeRoleByDefinitionId(definitionId: string): EnemyMeleeRoleSpec | null {
  return SPECS_BY_DEFINITION_ID.get(definitionId) ?? null
}

export function createEnemyRuntimeFromRole(
  role: EnemyMeleeRoleSpec,
  runtimeId: string = role.runtimeId,
  spawnPosition: Vector3Value = role.spawnPosition,
  initialFacing: PlayerFacingDirection = role.initialFacing,
): EnemyRuntime {
  return new EnemyRuntime(
    role.definition,
    runtimeId,
    spawnPosition,
    [role.attack],
    initialFacing,
  )
}

export function createGrayboxEnemyRuntimes(): EnemyRuntime[] {
  return GRAYBOX_ENEMY_ROLES.map((role) => createEnemyRuntimeFromRole(role))
}
