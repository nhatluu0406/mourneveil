import type { CombatActionDefinition, CombatActionId } from '../combat/combatAction'
import type { PlayerFacingDirection, Vector3Value } from '../character/playerMotor'
import { defineCombatAction } from '../combat/combatAction'
import {
  BOSS_ATTACK_KIT,
  BOSS_DEFINITION_ID,
  BOSS_RUNTIME_ID,
  BOSS_SLASH,
} from './bossKit'
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
  readonly guardImpact: number
  readonly contact: EnemyMeleeContactShape
  readonly spawnPosition: Vector3Value
  readonly initialFacing: PlayerFacingDirection
  readonly presentation: EnemyPresentationDefinition
}

export const SKIRMISHER_ATTACK = defineCombatAction({
  id: 'enemy.skirmisher.attack',
  startupSteps: 20,
  activeSteps: 10,
  recoverySteps: 24,
  resourceCost: null,
  cancellationPolicy: 'never',
  interruptibilityPolicy: 'never',
  contactWindowId: 'enemy.skirmisher.attack.contact',
  cooldownSteps: 0,
})

export const BRUTE_ATTACK = defineCombatAction({
  id: 'enemy.brute.attack',
  startupSteps: 48,
  activeSteps: 12,
  recoverySteps: 48,
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
  guardImpact: 1,
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
      idleAmplitude: 0.012,
      locomotionCadence: 0.22,
      attackAnticipation: 0.38,
      attackSwing: 0.62,
      recoveryWeight: 0.32,
      hitRecoil: 0.22,
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
  guardImpact: 2,
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
      idleAmplitude: 0.006,
      locomotionCadence: 0.09,
      attackAnticipation: 0.78,
      attackSwing: 0.95,
      recoveryWeight: 0.58,
      hitRecoil: 0.1,
    }),
  }),
})

export const BOSS_ROLE: EnemyMeleeRoleSpec = Object.freeze({
  runtimeId: BOSS_RUNTIME_ID,
  role: 'boss',
  definition: defineEnemy({
    id: BOSS_DEFINITION_ID,
    role: 'boss',
    tags: ['grounded', 'melee', 'boss'],
    body: { radius: 0.72, halfHeight: 0.85 },
    hurtbox: {
      id: 'hurtbox',
      kind: 'sphere',
      offset: { x: 0, y: 0, z: 0 },
      radius: 0.9,
    },
    maximumHealth: 420,
    movementSpeed: 1.55,
    perceptionRange: 8,
    stoppingRange: 1.85,
    attackRange: 2.35,
    attackActionIds: BOSS_ATTACK_KIT.map((entry) => entry.attack.id),
    echoReward: 200,
  }),
  attack: BOSS_SLASH,
  damage: BOSS_ATTACK_KIT[0]!.damage,
  guardImpact: BOSS_ATTACK_KIT[0]!.guardImpact,
  contact: BOSS_ATTACK_KIT[0]!.contact,
  spawnPosition: Object.freeze({ x: 13, y: 0.82, z: -4 }),
  initialFacing: Object.freeze({ x: -1, z: 0 }),
  presentation: Object.freeze({
    primaryColor: '#5c3d55',
    telegraphColor: '#e8a0ff',
    contactColor: '#ff4d6d',
    bodyScale: 1.55,
    animation: Object.freeze({
      idleAmplitude: 0.008,
      locomotionCadence: 0.08,
      attackAnticipation: 0.72,
      attackSwing: 1.05,
      recoveryWeight: 0.62,
      hitRecoil: 0.08,
    }),
  }),
})

export const GRAYBOX_ENEMY_ROLES: readonly EnemyMeleeRoleSpec[] = Object.freeze([
  SKIRMISHER_ROLE,
  BRUTE_ROLE,
])

export const CONNECTED_ENEMY_ROLES: readonly EnemyMeleeRoleSpec[] = Object.freeze([
  ...GRAYBOX_ENEMY_ROLES,
  BOSS_ROLE,
])

const PROFILES_BY_ACTION = new Map<CombatActionId, EnemyMeleeRoleSpec>()
for (const role of CONNECTED_ENEMY_ROLES) {
  PROFILES_BY_ACTION.set(role.attack.id, role)
}
for (const entry of BOSS_ATTACK_KIT) {
  PROFILES_BY_ACTION.set(entry.attack.id, BOSS_ROLE)
}

const SPECS_BY_RUNTIME_ID = new Map<string, EnemyMeleeRoleSpec>(
  CONNECTED_ENEMY_ROLES.map((role) => [role.runtimeId, role]),
)

const SPECS_BY_DEFINITION_ID = new Map<string, EnemyMeleeRoleSpec>(
  CONNECTED_ENEMY_ROLES.map((role) => [role.definition.id, role]),
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
  const attacks =
    role.role === 'boss' ? BOSS_ATTACK_KIT.map((entry) => entry.attack) : [role.attack]
  return new EnemyRuntime(role.definition, runtimeId, spawnPosition, attacks, initialFacing)
}

export function createGrayboxEnemyRuntimes(): EnemyRuntime[] {
  return GRAYBOX_ENEMY_ROLES.map((role) => createEnemyRuntimeFromRole(role))
}
