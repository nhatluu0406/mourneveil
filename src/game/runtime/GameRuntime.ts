import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { PlayerAttackRequest } from '../../input/playerAttackIntent'
import type { PlayerDodgeRequest } from '../../input/playerDefenseIntent'
import type {
  PlayerCheckpointInteractionRequest,
  PlayerRespawnRequest,
  PlayerWorldInteractionRequest,
} from '../../input/playerRecoveryIntent'
import type { PlayerFlaskUseRequest } from '../../input/playerFlaskIntent'
import type { PlayerSkillUseRequest } from '../../input/playerSkillIntent'
import type {
  CombatActionRequest,
  CombatResourceValidator,
} from '../combat/combatAction'
import {
  CombatActionRuntime,
  type CombatActionEndResult,
  type CombatActionSnapshot,
  type CombatActionStartResult,
} from '../combat/combatActionRuntime'
import {
  CombatContactRuntime,
  type CombatContactQuery,
  type CombatContactSnapshot,
  type CombatHitEvent,
  type CombatOcclusionQuery,
} from '../combat/combatContact'
import type { CombatDamageResult } from '../combat/combatHealth'
import {
  PLAYER_ATTACK_DEFINITIONS,
  constrainMovementIntentForAttack,
  createPlayerAttackSpatialSnapshot,
  playerAttackForActionId,
  playerAttackForRequest,
  type PlayerAttackSpatialSnapshot,
} from '../combat/playerAttackActions'
import {
  PLAYER_DODGE_ACTION,
  PLAYER_DODGE_ACTION_ID,
  PLAYER_DODGE_SPEED,
  PlayerDefenseRuntime,
  type PlayerDefenseSnapshot,
} from '../combat/playerDefense'
import {
  TrainingTargetRuntime,
  type TrainingTargetSnapshot,
} from '../combat/trainingTarget'
import {
  FixedStepClock,
  type FixedStepAdvance,
  type SimulationTimeSnapshot,
} from '../core/fixedStepClock'
import {
  advanceMeleeEnemy,
  createEnemyAttackSpatialSnapshot,
  enemyAttackDamage,
  enemyAttackGuardImpact,
  horizontalDistance,
  type EnemyAttackSpatialSnapshot,
} from '../enemies/meleeEnemy'
import {
  createEncounterSnapshot,
  createGrayboxEncounterSnapshot,
  type EncounterSnapshot,
  type GrayboxEncounterSnapshot,
} from '../encounters/grayboxEncounter'
import {
  M5_ENCOUNTERS,
  FINAL_GATE_PREREQUISITE_ENCOUNTER_IDS,
  connectedEnemyPlacementByRuntimeId,
  createConnectedLevelEnemyRuntimes,
} from '../encounters/connectedLevelEncounters'
import { BOSS_TECHNICAL_ID } from '../enemies/bossKit'
import {
  EncounterActivationRuntime,
  type EncounterActivationSnapshot,
} from '../encounters/encounterActivation'
import {
  advanceNavigationState,
  createEnemyNavigationState,
  currentNavigationWaypoint,
  isDirectPathObstructed,
  planLocalObstacleDetour,
  planConnectedNavigationRoute,
  zoneIdContainingPosition,
  type EnemyNavigationState,
  type LocalObstacleFootprint,
} from '../world/connectedNavigation'
import { activeConnectedLevelColliders } from '../../physics/connectedLevelCollision'
import type { EnemyRuntime, EnemyRuntimeSnapshot } from '../enemies/enemyRuntime'
import {
  CheckpointRuntime,
  CONNECTED_LEVEL_CHECKPOINT_DEFINITION,
  LEGACY_GRAYBOX_CHECKPOINT_ID,
  type CheckpointInteractionResult,
  type CheckpointSnapshot,
  type PlayerRespawnResult,
} from '../world/checkpoint'
import {
  EchoRecoveryRuntime,
  type EchoRecoverySnapshot,
} from '../world/echoRecovery'
import {
  PlayerHealthRuntime,
  type PlayerHealthSnapshot,
} from '../character/playerHealth'
import {
  PLAYER_FLASK_DEFINITION,
  PLAYER_FLASK_ACTION_ID,
  PlayerFlaskRuntime,
  type PlayerFlaskSnapshot,
} from '../character/playerFlask'
import {
  EchoesCurrencyRuntime,
  type EchoesSnapshot,
} from '../character/playerCurrency'
import type { EquipSlot, ItemId } from '../items/itemDefinition'
import { getItemDefinition } from '../items/itemDefinition'
import {
  PlayerInventoryRuntime,
  type InventorySnapshot,
} from '../items/playerInventory'
import {
  PlayerEquipmentRuntime,
  type EquipmentSnapshot,
  type EquipResult,
  type UnequipResult,
} from '../items/playerEquipment'
import {
  LootPickupRuntime,
  type LootPickupSnapshot,
} from '../items/lootPickup'
import {
  createDefaultSaveV4,
  type SaveFileV4,
} from '../save/saveSchema'
import {
  PlayerProgressionRuntime,
  type AllocateProgressionResult,
  type ProgressionSnapshot,
} from '../character/playerProgression'
import { resolvePlayerCombatStats } from '../character/playerStatResolution'
import {
  getSkillDefinition,
  skillCombatActions,
  SKILL_OATH_CLEAVE_ID,
  SKILL_WARD_PULSE,
} from '../skills/skillDefinition'
import {
  PlayerSkillRuntime,
  type EquipSkillResult,
  type PlayerSkillSnapshot,
} from '../skills/playerSkills'
import {
  ConnectedWorldRuntime,
  type ConnectedWorldSnapshot,
  type ShortcutOpenResult,
} from '../world/connectedWorldRuntime'
import { MOURNEVEIL_CONNECTED_LEVEL } from '../world/connectedLevel'
import { resolveConnectedRecoveryPosition } from '../world/connectedRecoveryPlacement'
import {
  createPlayerMotorState,
  stopPlayerMotor,
  stepPlayerMotor,
  stepPlayerDodgeMotor,
  type CharacterCollisionResolver,
  type PlayerFacingDirection,
  type PlayerMotorState,
} from '../character/playerMotor'

export const SKIRMISHER_LOOT_ITEM_ID = 'item.weapon.oathblade' as const
export const BRUTE_LOOT_ITEM_ID = 'item.charm.vitality' as const
export const PRESSURE_LOOT_ITEM_ID = 'item.charm.ward-seal' as const

export interface GameRuntimeSnapshot {
  readonly simulation: SimulationTimeSnapshot
  readonly player: PlayerMotorState
  readonly combat: CombatActionSnapshot
  readonly attack: PlayerAttackSpatialSnapshot
  readonly contact: CombatContactSnapshot
  readonly trainingTarget: TrainingTargetSnapshot
  readonly defense: PlayerDefenseSnapshot
  readonly playerHealth: PlayerHealthSnapshot
  /** Primary diagnostic enemy (skirmisher). Prefer `enemies` for multi-role fixtures. */
  readonly enemy: EnemyRuntimeSnapshot
  readonly enemyAttack: EnemyAttackSpatialSnapshot
  readonly enemyDistanceToPlayer: number
  readonly enemies: readonly EnemyRuntimeSnapshot[]
  readonly enemyAttacks: readonly EnemyAttackSpatialSnapshot[]
  readonly encounter: GrayboxEncounterSnapshot
  readonly encounters: readonly EncounterSnapshot[]
  readonly incomingContact: CombatContactSnapshot
  readonly checkpoint: CheckpointSnapshot
  readonly flask: PlayerFlaskSnapshot
  readonly echoes: EchoesSnapshot
  readonly echoRecovery: EchoRecoverySnapshot
  readonly inventory: InventorySnapshot
  readonly equipment: EquipmentSnapshot
  readonly lootPickup: LootPickupSnapshot
  /** Presentation-only last acquisition cue; not persisted. */
  readonly lastLootAcquisition: {
    readonly itemId: ItemId
    readonly simulationStep: number
  } | null
  /** Presentation-only progression feedback; not persisted. */
  readonly lastProgressionFeedback: {
    readonly experienceGained: number
    readonly levelsGained: number
    readonly pointsGained: number
    readonly simulationStep: number
  } | null
  readonly progression: ProgressionSnapshot
  readonly world: ConnectedWorldSnapshot
  readonly encounterActivation: EncounterActivationSnapshot
  readonly resolvedAttackDamage: {
    readonly light: number
    readonly heavy: number
  }
  /** Authoritative resolved contributions projected for character/build UI. */
  readonly resolvedProgressionContributions: {
    readonly maxHealth: number
    readonly guardImpactThreshold: number
    readonly lightDamage: number
    readonly heavyDamage: number
  }
  /** Active skill loadout + cooldown presentation hooks for UI/Codex. */
  readonly skills: PlayerSkillSnapshot
}

export interface GameRuntimeAdvance extends GameRuntimeSnapshot {
  readonly frame: FixedStepAdvance
  readonly hitEvents: readonly CombatHitEvent[]
  readonly incomingHitEvents: readonly CombatHitEvent[]
}

export class GameRuntime {
  private readonly clock = new FixedStepClock()
  private readonly combatRuntime = new CombatActionRuntime(
    [
      ...PLAYER_ATTACK_DEFINITIONS.map((definition) => definition.action),
      PLAYER_DODGE_ACTION,
      PLAYER_FLASK_DEFINITION.action,
      ...skillCombatActions(),
    ],
  )
  private readonly defenseRuntime = new PlayerDefenseRuntime()
  private readonly skillRuntime = new PlayerSkillRuntime()
  private readonly contactRuntime = new CombatContactRuntime()
  private readonly enemyContactRuntimes = new Map<string, CombatContactRuntime>()
  private readonly trainingTargetRuntime = new TrainingTargetRuntime()
  private readonly checkpointRuntime = new CheckpointRuntime()
  private readonly flaskRuntime = new PlayerFlaskRuntime()
  private readonly echoesRuntime = new EchoesCurrencyRuntime()
  private readonly echoRecoveryRuntime = new EchoRecoveryRuntime()
  private readonly inventoryRuntime = new PlayerInventoryRuntime()
  private readonly equipmentRuntime = new PlayerEquipmentRuntime()
  private readonly progressionRuntime = new PlayerProgressionRuntime()
  private readonly lootPickupRuntime = new LootPickupRuntime()
  private readonly worldRuntime = new ConnectedWorldRuntime()
  private readonly encounterActivationRuntime = new EncounterActivationRuntime()
  private readonly echoRewardedEnemyIds = new Set<string>()
  private readonly xpRewardedEnemyIds = new Set<string>()
  private lootInstanceCounter = 0
  private playerState = createPlayerMotorState(
    MOURNEVEIL_CONNECTED_LEVEL.entryPosition,
  )
  private readonly playerHealthRuntime = new PlayerHealthRuntime(
    this.playerState.position,
  )
  private readonly enemyRuntimes: EnemyRuntime[] = createConnectedLevelEnemyRuntimes()
  private readonly enemyNavigationStates = new Map<string, EnemyNavigationState>()
  private collisionResolver: CharacterCollisionResolver | null = null
  private readonly enemyCollisionResolvers = new Map<string, CharacterCollisionResolver>()
  private contactQuery: CombatContactQuery | null = null
  private occlusionQuery: CombatOcclusionQuery | null = null
  /** Frozen aim for the committed attack execution; null while combat is idle. */
  private attackExecutionFacing: PlayerFacingDirection | null = null
  private movementOverride: PlayerMovementIntent | null = null
  private persistHandler: (() => void) | null = null
  private lastLootAcquisition: { itemId: ItemId; simulationStep: number } | null = null
  private lastProgressionFeedback: {
    experienceGained: number
    levelsGained: number
    pointsGained: number
    simulationStep: number
  } | null = null

  setPersistHandler(handler: (() => void) | null): void {
    this.persistHandler = handler
  }

  captureSave(): SaveFileV4 {
    const checkpoint = this.checkpointRuntime.snapshot()
    const flask = this.flaskRuntime.snapshot()
    const echoes = this.echoesRuntime.snapshot()
    const recovery = this.echoRecoveryRuntime.snapshot()
    const equipment = this.equipmentRuntime.snapshot()
    const loot = this.lootPickupRuntime.snapshot()
    const progression = this.progressionRuntime.durable()
    return {
      version: 4,
      activeCheckpointId: checkpoint.currentCheckpointId,
      checkpointActivated: checkpoint.activated,
      flaskCharges: flask.currentCharges,
      echoesCarried: echoes.carried,
      echoRecovery: {
        active: recovery.active,
        amount: recovery.amount,
        position: recovery.position,
      },
      inventory: this.inventoryRuntime.snapshot().entries,
      equipment: {
        weaponItemId: equipment.weaponItemId,
        charmItemId: equipment.charmItemId,
      },
      lootPickup: {
        active: loot.active,
        instanceId: loot.instanceId,
        itemId: loot.itemId,
        position: loot.position,
        spawnedFromEnemyId: loot.spawnedFromEnemyId,
        spawnedFromEnemyIds: loot.spawnedFromEnemyIds,
      },
      world: {
        openedShortcutIds: this.worldRuntime.snapshot().openedShortcutIds,
        finalGateReached: this.worldRuntime.snapshot().finalGateReached,
        defeatedBossIds: this.worldRuntime.snapshot().defeatedBossIds,
      },
      progression: {
        level: progression.level,
        experience: progression.experience,
        unspentPoints: progression.unspentPoints,
        allocation: { ...progression.allocation },
      },
      skills: {
        equippedSkillId: this.skillRuntime.durableEquippedSkillId(),
      },
    }
  }

  /**
   * Restores persistent facts only. Encounter enemies reset; transient combat/input cleared.
   */
  applySave(save: SaveFileV4 = createDefaultSaveV4()): void {
    this.resetPlayerActionState()
    this.checkpointRuntime.restore(
      save.checkpointActivated,
      save.activeCheckpointId === CONNECTED_LEVEL_CHECKPOINT_DEFINITION.id ||
      save.activeCheckpointId === LEGACY_GRAYBOX_CHECKPOINT_ID
        ? CONNECTED_LEVEL_CHECKPOINT_DEFINITION.id
        : null,
    )
    this.playerState = createPlayerMotorState(
      this.checkpointRuntime.activeRespawnPosition() ?? MOURNEVEIL_CONNECTED_LEVEL.entryPosition,
    )
    this.playerHealthRuntime.updatePosition(this.playerState.position)
    this.worldRuntime.restore(save.world)
    this.flaskRuntime.setCharges(save.flaskCharges)
    this.echoesRuntime.setCarried(save.echoesCarried)
    this.echoRecoveryRuntime.restore({
      ...save.echoRecovery,
      position:
        save.echoRecovery.position === null
          ? null
          : resolveConnectedRecoveryPosition(save.echoRecovery.position),
    })
    const owned = save.inventory.filter((entry) => getItemDefinition(entry.itemId) !== null)
    this.inventoryRuntime.replaceAll(owned)
    const weapon =
      save.equipment.weaponItemId !== null &&
      this.inventoryRuntime.has(save.equipment.weaponItemId)
        ? save.equipment.weaponItemId
        : null
    const charm =
      save.equipment.charmItemId !== null &&
      this.inventoryRuntime.has(save.equipment.charmItemId)
        ? save.equipment.charmItemId
        : null
    this.equipmentRuntime.restore(weapon, charm)
    this.progressionRuntime.restore(save.progression)
    this.skillRuntime.syncLevel(this.progressionRuntime.durable().level)
    this.skillRuntime.restoreEquipped(save.skills.equippedSkillId)
    this.lastProgressionFeedback = null
    this.syncResolvedCombatStats()
    this.playerHealthRuntime.restoreToMaximum()
    this.lootPickupRuntime.restore({
      active: save.lootPickup.active && save.lootPickup.itemId !== null,
      instanceId: save.lootPickup.instanceId,
      itemId:
        save.lootPickup.itemId !== null && getItemDefinition(save.lootPickup.itemId) !== null
          ? save.lootPickup.itemId
          : null,
      position: save.lootPickup.position,
      spawnedFromEnemyId: save.lootPickup.spawnedFromEnemyId,
      spawnedFromEnemyIds: save.lootPickup.spawnedFromEnemyIds,
    })
    this.resetGrayboxEncounterKeepingLootMemory()
  }

  private markPersistentChange(): void {
    this.persistHandler?.()
  }

  private resetGrayboxEncounterKeepingLootMemory(): void {
    for (const enemy of this.enemyRuntimes) {
      const placement = connectedEnemyPlacementByRuntimeId(enemy.id)
      enemy.reset(placement?.spawnPosition ?? enemy.snapshot().position)
      this.enemyContactRuntimeFor(enemy.id).reset()
      this.enemyNavigationStates.delete(enemy.id)
      this.reapplyPersistentBossDefeat(enemy)
    }
    this.encounterActivationRuntime.reset()
    this.echoRewardedEnemyIds.clear()
    this.xpRewardedEnemyIds.clear()
    // Keep loot spawn memory / active pickup from save; do not resetLifecycle.
  }

  requestCombatAction(
    request: CombatActionRequest,
    validateResources?: CombatResourceValidator,
  ): CombatActionStartResult {
    if (!this.playerHealthRuntime.snapshot().health.alive) {
      return {
        accepted: false,
        actionId: request.actionId,
        reason: 'actor-defeated',
      }
    }
    return this.combatRuntime.request(request, validateResources)
  }

  requestPlayerAttack(request: PlayerAttackRequest): CombatActionStartResult {
    if (!this.playerHealthRuntime.snapshot().health.alive) {
      return {
        accepted: false,
        actionId: playerAttackForRequest(request).action.id,
        reason: 'actor-defeated',
      }
    }
    if (!this.defenseRuntime.canStartAction()) {
      return {
        accepted: false,
        actionId: playerAttackForRequest(request).action.id,
        reason: 'guard-active',
      }
    }
    const attack = playerAttackForRequest(request)
    const result = this.requestCombatAction({
      type: 'start-action',
      actionId: attack.action.id,
    })
    if (result.accepted) {
      this.attackExecutionFacing = { ...request.aimDirection }
      this.playerState = {
        ...this.playerState,
        facing: { ...request.aimDirection },
      }
    }
    return result
  }

  requestPlayerDodge(
    request: PlayerDodgeRequest,
    movementIntent: PlayerMovementIntent,
  ): CombatActionStartResult {
    if (!this.playerHealthRuntime.snapshot().health.alive) {
      return { accepted: false, actionId: PLAYER_DODGE_ACTION_ID, reason: 'actor-defeated' }
    }
    if (!this.defenseRuntime.canStartAction()) {
      return { accepted: false, actionId: PLAYER_DODGE_ACTION_ID, reason: 'guard-active' }
    }
    const direction = this.defenseRuntime.sampleDodgeDirection(
      request,
      movementIntent,
      this.playerState.facing,
    )
    const result = this.requestCombatAction({
      type: 'start-action',
      actionId: PLAYER_DODGE_ACTION_ID,
    })
    this.defenseRuntime.acceptDodge(result, direction)
    if (result.accepted) {
      this.attackExecutionFacing = null
      this.playerState = { ...this.playerState, facing: { ...direction } }
    }
    return result
  }

  setGuardIntent(held: boolean): void {
    this.defenseRuntime.setGuardIntent(
      this.playerHealthRuntime.snapshot().health.alive && held,
    )
  }

  interruptCombatAction(): CombatActionEndResult {
    const result = this.combatRuntime.requestInterruption()
    if (this.combatRuntime.snapshot().phase === 'idle') {
      this.attackExecutionFacing = null
    }
    return result
  }

  attachCollisionResolver(resolver: CharacterCollisionResolver): () => void {
    this.collisionResolver = resolver

    return () => {
      if (this.collisionResolver === resolver) {
        this.collisionResolver = null
      }
    }
  }

  attachEnemyCollisionResolver(
    enemyId: string,
    resolver: CharacterCollisionResolver,
  ): () => void {
    this.enemyCollisionResolvers.set(enemyId, resolver)
    return () => {
      if (this.enemyCollisionResolvers.get(enemyId) === resolver) {
        this.enemyCollisionResolvers.delete(enemyId)
      }
    }
  }

  enemyIds(): readonly string[] {
    return this.enemyRuntimes.map((enemy) => enemy.id)
  }

  attachCombatContactQuery(query: CombatContactQuery): () => void {
    this.contactQuery = query

    return () => {
      if (this.contactQuery === query) {
        this.contactQuery = null
      }
    }
  }

  attachCombatOcclusionQuery(query: CombatOcclusionQuery): () => void {
    this.occlusionQuery = query

    return () => {
      if (this.occlusionQuery === query) {
        this.occlusionQuery = null
      }
    }
  }

  resetTrainingTarget(): void {
    this.trainingTargetRuntime.reset()
  }

  resetMeleeFixture(): void {
    this.restorePlayerForDevelopment()
    this.resetGrayboxEncounter()
  }

  resetGrayboxEncounter(): void {
    for (const enemy of this.enemyRuntimes) {
      const placement = connectedEnemyPlacementByRuntimeId(enemy.id)
      enemy.reset(placement?.spawnPosition ?? enemy.snapshot().position)
      this.enemyContactRuntimeFor(enemy.id).reset()
      this.enemyNavigationStates.delete(enemy.id)
      this.reapplyPersistentBossDefeat(enemy)
    }
    this.encounterActivationRuntime.reset()
    this.echoRewardedEnemyIds.clear()
    this.xpRewardedEnemyIds.clear()
    this.lootPickupRuntime.resetLifecycle()
  }

  /** Development-only restore; gameplay recovery must use checkpoint respawn. */
  restorePlayerForDevelopment(): void {
    this.playerHealthRuntime.restoreToMaximum()
    this.resetPlayerActionState()
    this.playerState = stopPlayerMotor(this.playerState)
  }

  applyPlayerDamage(damage: number): CombatDamageResult {
    const result = this.playerHealthRuntime.applyDamage(damage)
    if (result.applied && !result.health.alive) {
      this.enterPlayerDefeatedState()
    }
    return result
  }

  /** Development/gate helper: instantly defeat an encounter enemy and grant its Echo reward once. */
  debugDefeatEnemy(enemyId: string): void {
    const enemy = this.enemyRuntimes.find((entry) => entry.id === enemyId)
    if (enemy === undefined) return
    if (!enemy.snapshot().alive) {
      this.grantEchoRewardsForDefeatedEnemies()
      return
    }
    enemy.applyDamage(enemy.snapshot().health.current)
    this.grantEchoRewardsForDefeatedEnemies()
    this.spawnLootForDefeatedEnemies()
  }

  /** Development/gate helper: place the living player at an authored graybox position. */
  debugSetPlayerPosition(position: { readonly x: number; readonly y: number; readonly z: number }): void {
    if (!this.playerHealthRuntime.snapshot().health.alive) return
    this.playerState = createPlayerMotorState(position)
    this.playerHealthRuntime.updatePosition(position)
    this.worldRuntime.updatePlayerPosition(position)
  }

  /** Development/gate helper: set authoritative facing without authoring movement. */
  debugSetPlayerFacing(facing: PlayerFacingDirection): void {
    if (!this.playerHealthRuntime.snapshot().health.alive) return
    const magnitude = Math.hypot(facing.x, facing.z)
    if (magnitude <= 0.0001) return
    this.playerState = {
      ...this.playerState,
      facing: { x: facing.x / magnitude, z: facing.z / magnitude },
    }
  }

  /** Development/gate: sticky movement consumed by advanceFrame until cleared. */
  debugSetMovementOverride(intent: PlayerMovementIntent | null): void {
    this.movementOverride = intent === null ? null : { ...intent }
  }

  equipItem(itemId: ItemId): EquipResult {
    const result = this.equipmentRuntime.equip(itemId, this.inventoryRuntime)
    if (result.accepted) {
      this.syncResolvedCombatStats()
      this.markPersistentChange()
    }
    return result
  }

  unequipSlot(slot: EquipSlot): UnequipResult {
    const result = this.equipmentRuntime.unequip(slot)
    if (result.accepted) {
      this.syncResolvedCombatStats()
      this.markPersistentChange()
    }
    return result
  }

  allocateProgression(attribute: string): AllocateProgressionResult {
    const result = this.progressionRuntime.allocate(attribute)
    if (result.accepted) {
      this.skillRuntime.syncLevel(result.state.level)
      this.syncResolvedCombatStats()
      this.markPersistentChange()
    }
    return result
  }

  equipSkill(skillId: string): EquipSkillResult {
    const result = this.skillRuntime.equip(skillId, {
      alive: this.playerHealthRuntime.snapshot().health.alive,
      combatIdle: this.combatRuntime.snapshot().phase === 'idle',
    })
    if (result.accepted) this.markPersistentChange()
    return result
  }

  requestPlayerSkillUse(
    request: PlayerSkillUseRequest,
    movementIntent: PlayerMovementIntent,
  ): CombatActionStartResult {
    void request
    const equippedId = this.skillRuntime.durableEquippedSkillId()
    const gate = this.skillRuntime.activationGate({
      alive: this.playerHealthRuntime.snapshot().health.alive,
      combatIdle: this.combatRuntime.snapshot().phase === 'idle',
      canStartAction: this.defenseRuntime.canStartAction(),
      cooldownRemaining:
        equippedId === null ? 0 : this.combatRuntime.cooldownRemainingSteps(equippedId),
    })
    if (!gate.allowed) {
      const reason =
        gate.reason === 'actor-defeated'
          ? 'actor-defeated'
          : gate.reason === 'guard-active'
            ? 'guard-active'
            : gate.reason === 'cooldown-active'
              ? 'cooldown-active'
              : gate.reason === 'combat-busy'
                ? 'action-in-progress'
                : 'unknown-action'
      return { accepted: false, actionId: gate.actionId, reason }
    }

    const definition = gate.definition
    const direction =
      definition.effect.kind === 'reposition'
        ? this.skillRuntime.sampleRepositionDirection(
            movementIntent,
            this.playerState.facing,
          )
        : null
    const result = this.requestCombatAction({
      type: 'start-action',
      actionId: definition.action.id,
    })
    this.skillRuntime.acceptActivation(result, direction)
    if (result.accepted) {
      if (definition.id === SKILL_OATH_CLEAVE_ID) {
        const facing = { ...this.playerState.facing }
        this.attackExecutionFacing = facing
        this.playerState = { ...this.playerState, facing }
      } else if (direction !== null) {
        this.attackExecutionFacing = null
        this.playerState = { ...this.playerState, facing: { ...direction } }
      } else {
        this.attackExecutionFacing = null
      }
    }
    return result
  }

  resolvedAttackDamage(): { readonly light: number; readonly heavy: number } {
    const resolved = resolvePlayerCombatStats(
      this.progressionRuntime.durable().allocation,
      this.equipmentRuntime.resolvedModifiers(),
    )
    return {
      light: resolved.lightDamage,
      heavy: resolved.heavyDamage,
    }
  }

  requestPlayerFlaskUse(request: PlayerFlaskUseRequest): CombatActionStartResult {
    void request
    if (!this.defenseRuntime.canStartAction()) {
      return {
        accepted: false,
        actionId: PLAYER_FLASK_ACTION_ID,
        reason: 'guard-active',
      }
    }
    const result = this.requestCombatAction(
      { type: 'start-action', actionId: PLAYER_FLASK_ACTION_ID },
      () => {
        const eligibility = this.flaskRuntime.validateUse(
          this.playerHealthRuntime.snapshot().health,
        )
        return eligibility.allowed
          ? { allowed: true }
          : { allowed: false, reason: eligibility.reason }
      },
    )
    this.flaskRuntime.acceptUse(result)
    return result
  }

  requestCheckpointInteraction(
    request: PlayerCheckpointInteractionRequest,
  ): CheckpointInteractionResult {
    void request
    const result = this.checkpointRuntime.interact(
      this.playerState.position,
      this.playerHealthRuntime.snapshot().health.alive,
    )
    if (result.accepted) {
      this.flaskRuntime.refill()
      this.resetGrayboxEncounterKeepingLootMemory()
      this.markPersistentChange()
    }
    return result
  }

  requestWorldInteraction(request: PlayerWorldInteractionRequest):
    | { readonly kind: 'checkpoint'; readonly result: CheckpointInteractionResult }
    | { readonly kind: 'shortcut'; readonly result: ShortcutOpenResult }
    | { readonly kind: 'none'; readonly accepted: false } {
    void request
    const checkpointResult = this.requestCheckpointInteraction({
      type: 'player-checkpoint-interaction',
    })
    if (checkpointResult.accepted) return { kind: 'checkpoint', result: checkpointResult }
    if (!this.playerHealthRuntime.snapshot().health.alive) {
      return { kind: 'none', accepted: false }
    }
    const shortcutResult = this.worldRuntime.openShortcut(
      'connection.shortcut-checkpoint-mixed',
      this.playerState.position,
    )
    if (shortcutResult.accepted) {
      if (shortcutResult.changed) this.markPersistentChange()
      return { kind: 'shortcut', result: shortcutResult }
    }
    return { kind: 'none', accepted: false }
  }

  requestRespawn(request: PlayerRespawnRequest): PlayerRespawnResult {
    void request
    if (this.playerHealthRuntime.snapshot().health.alive) {
      return { accepted: false, reason: 'actor-alive' }
    }
    const respawnPosition = this.checkpointRuntime.activeRespawnPosition()
    if (respawnPosition === null) {
      return { accepted: false, reason: 'no-active-checkpoint' }
    }

    this.playerState = createPlayerMotorState(respawnPosition)
    this.playerHealthRuntime.updatePosition(respawnPosition)
    this.playerHealthRuntime.restoreToMaximum()
    this.resetPlayerActionState()
    this.flaskRuntime.refill()
    this.resetGrayboxEncounterKeepingLootMemory()
    this.markPersistentChange()
    return {
      accepted: true,
      checkpointId: this.checkpointRuntime.definition.id,
    }
  }

  advanceFrame(
    frameDeltaSeconds: number,
    movementIntent: PlayerMovementIntent,
  ): GameRuntimeAdvance {
    const resolvedMovement = this.movementOverride ?? movementIntent
    const hitEvents: CombatHitEvent[] = []
    const incomingHitEvents: CombatHitEvent[] = []
    const frame = this.clock.advance(frameDeltaSeconds, (fixedStepSeconds, nextStepCount) => {
      const playerAlive = this.playerHealthRuntime.snapshot().health.alive
      if (playerAlive) this.combatRuntime.advanceFixedStep()
      const combat = this.combatRuntime.snapshot()
      if (combat.phase === 'idle') {
        this.attackExecutionFacing = null
      }
      this.defenseRuntime.advanceFixedStep(combat)
      this.skillRuntime.advanceFixedStep(combat)
      if (this.skillRuntime.consumeWardPulseApplication(combat)) {
        const effect = SKILL_WARD_PULSE.effect
        if (effect.kind === 'guard-relief') {
          this.defenseRuntime.applyWardPulse({
            clearImpact: effect.clearImpact,
            temporaryThresholdBonus: effect.temporaryThresholdBonus,
            temporaryDurationSteps: effect.temporaryDurationSteps,
          })
        }
      }
      const flaskHealAmount = this.flaskRuntime.advanceFixedStep(combat)
      if (flaskHealAmount !== null) {
        const restoration = this.playerHealthRuntime.restore(flaskHealAmount)
        this.flaskRuntime.recordRestoration(restoration.restoredHealth)
        this.markPersistentChange()
      }
      if (playerAlive && this.collisionResolver !== null) {
        const defense = this.defenseRuntime.snapshot(combat)
        const skills = this.skillRuntime.snapshot(combat, {
          remainingSteps: (actionId) => this.combatRuntime.cooldownRemainingSteps(actionId),
        })
        if (defense.dodgeDirection !== null) {
          this.playerState = stepPlayerDodgeMotor(
            this.playerState,
            defense.dodgeDirection,
            defense.dodgeMovementActive ? PLAYER_DODGE_SPEED : 0,
            fixedStepSeconds,
            this.collisionResolver,
          )
        } else if (skills.repositionDirection !== null) {
          this.playerState = stepPlayerDodgeMotor(
            this.playerState,
            skills.repositionDirection,
            skills.repositionMovementActive ? skills.repositionSpeed : 0,
            fixedStepSeconds,
            this.collisionResolver,
          )
        } else {
          const constrainedMovementIntent = constrainMovementIntentForAttack(
            {
              horizontal: resolvedMovement.horizontal * defense.movementScale,
              forward: resolvedMovement.forward * defense.movementScale,
            },
            combat.phase,
          )
          this.playerState = stepPlayerMotor(
            this.playerState,
            constrainedMovementIntent,
            fixedStepSeconds,
            this.collisionResolver,
          )
        }
      }
      this.playerHealthRuntime.updatePosition(this.playerState.position)
      this.worldRuntime.updatePlayerPosition(this.playerState.position)
      this.encounterActivationRuntime.update(this.playerState.position)
      if (playerAlive) {
        const pickup = this.echoRecoveryRuntime.tryPickup(
          this.playerState.position,
          true,
        )
        if (pickup.accepted) {
          this.echoesRuntime.add(pickup.amount)
          this.markPersistentChange()
        }
        const loot = this.lootPickupRuntime.tryPickup(this.playerState.position, true)
        if (loot.accepted) {
          this.inventoryRuntime.add(loot.itemId)
          this.lastLootAcquisition = {
            itemId: loot.itemId,
            simulationStep: nextStepCount,
          }
          this.markPersistentChange()
        }
      }
      const localObstacles = this.localObstacleFootprints()
      for (const enemyRuntime of this.enemyRuntimes) {
        const simulationEnabled = this.encounterActivationRuntime.isEnemySimulationEnabled(
          enemyRuntime.id,
          this.playerState.position,
        )
        if (!simulationEnabled) {
          advanceMeleeEnemy(
            enemyRuntime,
            this.playerState.position,
            fixedStepSeconds,
            null,
            { targetAlive: false },
          )
          this.enemyNavigationStates.delete(enemyRuntime.id)
          continue
        }

        let navigation = this.enemyNavigationStates.get(enemyRuntime.id) ?? null
        const enemySnapshot = enemyRuntime.snapshot()
        const sameZone =
          zoneIdContainingPosition(enemySnapshot.position) ===
          zoneIdContainingPosition(this.playerState.position)
        const directPathObstructed =
          sameZone &&
          isDirectPathObstructed(
            enemySnapshot.position,
            this.playerState.position,
            enemyRuntime.definition.body.radius,
            localObstacles,
          )
        if (
          navigation?.kind === 'local-detour' &&
          !directPathObstructed
        ) {
          this.enemyNavigationStates.delete(enemyRuntime.id)
          navigation = null
        }
        if (
          navigation === null &&
          enemySnapshot.state === 'pursue' &&
          directPathObstructed
        ) {
          const detour = planLocalObstacleDetour(
            enemySnapshot.position,
            this.playerState.position,
            enemyRuntime.definition.body.radius,
            localObstacles,
          )
          if (detour !== null) {
            navigation = createEnemyNavigationState(detour, 'local-detour')
            this.enemyNavigationStates.set(enemyRuntime.id, navigation)
          }
        }
        const distanceToPlayer = horizontalDistance(
          enemySnapshot.position,
          this.playerState.position,
        )
        if (
          navigation !== null &&
          distanceToPlayer <= enemyRuntime.definition.attackRange * 1.35
        ) {
          this.enemyNavigationStates.delete(enemyRuntime.id)
          navigation = null
        }
        if (navigation !== null) {
          navigation = advanceNavigationState(
            navigation,
            enemySnapshot.position,
            navigation.kind === 'local-detour' ? 0.18 : 0.85,
          )
          if (navigation === null) {
            this.enemyNavigationStates.delete(enemyRuntime.id)
          } else {
            this.enemyNavigationStates.set(enemyRuntime.id, navigation)
          }
        }
        const navigationTarget = currentNavigationWaypoint(navigation)
        advanceMeleeEnemy(
          enemyRuntime,
          this.playerState.position,
          fixedStepSeconds,
          this.enemyCollisionResolvers.get(enemyRuntime.id) ?? null,
          {
            targetAlive: playerAlive,
            navigationTarget,
            simulationStep: nextStepCount,
            onDirectPursuitBlocked: () => {
              this.ensureEnemyNavigationRoute(enemyRuntime.id)
            },
          },
        )
      }
      if (this.contactQuery !== null) {
        const combatSnapshot = this.combatRuntime.snapshot()
        const attack = createPlayerAttackSpatialSnapshot(
          combatSnapshot,
          this.playerState.position,
          this.attackExecutionFacing,
        )
        hitEvents.push(
          ...this.contactRuntime.resolvePlayerContact({
            combat: combatSnapshot,
            attack,
            simulationStep: nextStepCount,
            targets: [...this.enemyRuntimes],
            query: this.contactQuery,
            damageOverride: this.resolvedDamageForAction(combatSnapshot.actionId),
            attackOrigin: this.playerState.position,
            occlusionQuery: this.occlusionQuery ?? undefined,
          }),
        )
        for (const hit of hitEvents) {
          if (hit.outcome !== 'damaged') continue
          const enemyRuntime = this.enemyRuntimes.find((entry) => entry.id === hit.targetId)
          enemyRuntime?.applyHitReactionFromDamagedHit(hit)
        }
        this.grantEchoRewardsForDefeatedEnemies()
        this.spawnLootForDefeatedEnemies()
        if (playerAlive) {
          for (const enemyRuntime of this.enemyRuntimes) {
            if (
              !this.encounterActivationRuntime.isEnemySimulationEnabled(
                enemyRuntime.id,
                this.playerState.position,
              )
            ) {
              continue
            }
            const enemy = enemyRuntime.snapshot()
            const enemyAttack = createEnemyAttackSpatialSnapshot(enemy)
            incomingHitEvents.push(
              ...this.enemyContactRuntimeFor(enemy.id).resolveContact({
                attackerId: enemy.id,
                combat: enemy.action,
                contactShape: enemyAttack.activeContactShape,
                simulationStep: nextStepCount,
                targets: [this.playerHealthRuntime],
                query: this.contactQuery,
                damage: enemyAttackDamage(enemy),
                attackOrigin: enemy.position,
                occlusionQuery: this.occlusionQuery ?? undefined,
                resolveDamage: (target, damage) => {
                  const outcome = this.defenseRuntime.resolveIncomingMelee(
                    combatSnapshot,
                    this.playerState.facing,
                    enemyAttack.executionFacing ?? enemy.facing,
                    enemyAttackGuardImpact(enemy),
                  )
                  if (outcome === 'damaged') {
                    return { outcome, result: this.applyPlayerDamage(damage) }
                  }
                  const health = target.snapshot().health
                  const result: CombatDamageResult = {
                    applied: false,
                    appliedDamage: 0,
                    health,
                  }
                  return { outcome, result }
                },
              }),
            )
          }
        }
      }
      this.updateFinalGateProgress()
    })

    return { ...this.snapshot(), frame, hitEvents, incomingHitEvents }
  }

  snapshot(): GameRuntimeSnapshot {
    const combat = this.combatRuntime.snapshot()
    if (combat.phase === 'idle') {
      this.attackExecutionFacing = null
    }
    this.playerHealthRuntime.updatePosition(this.playerState.position)
    this.worldRuntime.updatePlayerPosition(this.playerState.position)
    const enemies = this.enemyRuntimes.map((enemy) => enemy.snapshot())
    const enemyAttacks = enemies.map((enemy) => createEnemyAttackSpatialSnapshot(enemy))
    const enemy = enemies[0]
    const enemyAttack = enemyAttacks[0]
    const lastIncoming = [...this.enemyContactRuntimes.values()]
      .map((runtime) => runtime.snapshot())
      .reduce<CombatContactSnapshot>(
        (latest, snapshot) => {
          if (snapshot.lastHit === null) return latest
          if (latest.lastHit === null) return snapshot
          return snapshot.lastHit.simulationStep >= latest.lastHit.simulationStep
            ? snapshot
            : latest
        },
        { totalHitCount: 0, lastHit: null },
      )
    return {
      simulation: this.clock.snapshot(),
      player: this.playerState,
      combat,
      attack: createPlayerAttackSpatialSnapshot(
        combat,
        this.playerState.position,
        this.attackExecutionFacing,
      ),
      contact: this.contactRuntime.snapshot(),
      trainingTarget: this.trainingTargetRuntime.snapshot(),
      defense: this.defenseRuntime.snapshot(combat),
      playerHealth: this.playerHealthRuntime.snapshot(),
      enemy,
      enemyAttack,
      enemyDistanceToPlayer: horizontalDistance(
        enemy.position,
        this.playerState.position,
      ),
      enemies,
      enemyAttacks,
      encounter: createGrayboxEncounterSnapshot(
        M5_ENCOUNTERS.find((encounter) => encounter.id === 'encounter.m5.mixed')!.enemyIds,
        enemies,
      ),
      encounters: M5_ENCOUNTERS.map((encounter) =>
        createEncounterSnapshot(encounter.id, encounter.enemyIds, enemies),
      ),
      incomingContact: {
        totalHitCount: [...this.enemyContactRuntimes.values()].reduce(
          (sum, runtime) => sum + runtime.snapshot().totalHitCount,
          0,
        ),
        lastHit: lastIncoming.lastHit,
      },
      checkpoint: this.checkpointRuntime.snapshot(),
      flask: this.flaskRuntime.snapshot(),
      echoes: this.echoesRuntime.snapshot(),
      echoRecovery: this.echoRecoveryRuntime.snapshot(),
      inventory: this.inventoryRuntime.snapshot(),
      equipment: this.equipmentRuntime.snapshot(),
      lootPickup: this.lootPickupRuntime.snapshot(),
      lastLootAcquisition: this.lastLootAcquisition,
      lastProgressionFeedback: this.lastProgressionFeedback,
      progression: this.progressionRuntime.snapshot(),
      world: this.worldRuntime.snapshot(),
      encounterActivation: this.encounterActivationRuntime.snapshot(),
      resolvedAttackDamage: this.resolvedAttackDamage(),
      resolvedProgressionContributions: this.resolvedProgressionContributions(),
      skills: this.skillRuntime.snapshot(combat, {
        remainingSteps: (actionId) => this.combatRuntime.cooldownRemainingSteps(actionId),
      }),
    }
  }

  private ensureEnemyNavigationRoute(enemyId: string): void {
    const existing = this.enemyNavigationStates.get(enemyId)
    if (existing !== undefined) {
      const nextIndex = existing.routeIndex + 1
      if (nextIndex < existing.routeNodeIds.length) {
        this.enemyNavigationStates.set(enemyId, {
          kind: existing.kind,
          routeNodeIds: existing.routeNodeIds,
          positions: existing.positions,
          routeIndex: nextIndex,
        })
        return
      }
      this.enemyNavigationStates.delete(enemyId)
    }
    const enemy = this.enemyRuntimes.find((entry) => entry.id === enemyId)
    if (enemy === undefined) return
    const route = planConnectedNavigationRoute(
      enemy.snapshot().position,
      this.playerState.position,
      (connectionId) => this.worldRuntime.isConnectionOpen(connectionId),
    )
    if (route === null) return
    this.enemyNavigationStates.set(enemyId, createEnemyNavigationState(route))
  }

  private localObstacleFootprints(): readonly LocalObstacleFootprint[] {
    const world = this.worldRuntime.snapshot()
    return activeConnectedLevelColliders({
      shortcutOpen: world.openedShortcutIds.includes(
        'connection.shortcut-checkpoint-mixed',
      ),
      finalGateOpen: world.finalGateReached,
    })
      .filter((collider) => collider.kind !== 'floor')
      .map((collider) => ({
        id: collider.id,
        centerX: collider.position[0],
        centerZ: collider.position[2],
        halfX: collider.size[0] / 2,
        halfZ: collider.size[2] / 2,
      }))
  }

  private resolvedDamageForAction(actionId: string | null): number | undefined {
    if (actionId === null) return undefined
    const attack = playerAttackForActionId(actionId)
    const damage = this.resolvedAttackDamage()
    if (attack !== null) {
      if (attack.kind === 'light') return damage.light
      return damage.heavy
    }
    const skill = getSkillDefinition(actionId)
    if (skill?.effect.kind === 'empowered-melee') {
      return damage.heavy + skill.effect.damageBonus
    }
    return undefined
  }

  private syncResolvedCombatStats(): void {
    const resolved = resolvePlayerCombatStats(
      this.progressionRuntime.durable().allocation,
      this.equipmentRuntime.resolvedModifiers(),
    )
    this.playerHealthRuntime.setMaximumHealthBonus(resolved.maximumHealthBonus)
    this.defenseRuntime.setGuardImpactThreshold(resolved.guardImpactThreshold)
  }

  private resolvedProgressionContributions(): GameRuntimeSnapshot['resolvedProgressionContributions'] {
    const resolved = resolvePlayerCombatStats(
      this.progressionRuntime.durable().allocation,
      this.equipmentRuntime.resolvedModifiers(),
    )
    return {
      maxHealth: resolved.progression.maxHealthFromProgression,
      guardImpactThreshold: resolved.progression.guardFromProgression,
      lightDamage: resolved.progression.lightDamageFromProgression,
      heavyDamage: resolved.progression.heavyDamageFromProgression,
    }
  }

  private spawnLootForDefeatedEnemies(): void {
    for (const enemy of this.enemyRuntimes) {
      const snapshot = enemy.snapshot()
      if (snapshot.alive) continue
      const itemId = connectedEnemyPlacementByRuntimeId(enemy.id)?.lootItemId ?? null
      if (itemId === null) continue
      this.lootInstanceCounter += 1
      if (
        this.lootPickupRuntime.spawnFromEnemy(
          enemy.id,
          itemId,
          snapshot.position,
          `loot.${enemy.id}.${this.lootInstanceCounter}`,
        )
      ) {
        this.markPersistentChange()
      }
    }
  }

  private grantEchoRewardsForDefeatedEnemies(): void {
    let experienceGained = 0
    let levelsGained = 0
    let pointsGained = 0
    for (const enemy of this.enemyRuntimes) {
      const snapshot = enemy.snapshot()
      if (snapshot.alive || this.echoRewardedEnemyIds.has(enemy.id)) continue
      this.echoRewardedEnemyIds.add(enemy.id)

      // Persistently defeated bosses must not re-grant Echoes/XP after reload.
      if (
        enemy.definition.role === 'boss' &&
        this.worldRuntime.isBossDefeated(BOSS_TECHNICAL_ID)
      ) {
        this.xpRewardedEnemyIds.add(enemy.id)
        continue
      }

      if (enemy.definition.role === 'boss') {
        if (this.worldRuntime.markBossDefeated(BOSS_TECHNICAL_ID)) {
          this.markPersistentChange()
        }
      }
      const reward = enemy.definition.echoReward
      if (reward > 0) {
        this.echoesRuntime.add(reward)
        this.markPersistentChange()
      }
      if (!this.xpRewardedEnemyIds.has(enemy.id)) {
        this.xpRewardedEnemyIds.add(enemy.id)
        const xp = enemy.definition.xpReward
        if (xp > 0) {
          const granted = this.progressionRuntime.grantExperience(xp)
          if (granted.applied) {
            experienceGained += granted.experienceGained
            levelsGained += granted.levelsGained
            pointsGained += granted.pointsGained
            this.skillRuntime.syncLevel(granted.state.level)
            this.markPersistentChange()
          }
        }
      }
    }
    if (experienceGained > 0) {
      this.lastProgressionFeedback = {
        experienceGained,
        levelsGained,
        pointsGained,
        simulationStep: this.clock.snapshot().stepCount,
      }
    }
  }

  private reapplyPersistentBossDefeat(enemy: EnemyRuntime): void {
    if (enemy.definition.role !== 'boss') return
    if (!this.worldRuntime.isBossDefeated(BOSS_TECHNICAL_ID)) return
    enemy.applyDamage(enemy.snapshot().health.current)
  }

  private updateFinalGateProgress(): void {
    const enemies = this.enemyRuntimes.map((enemy) => enemy.snapshot())
    const prerequisitesComplete = FINAL_GATE_PREREQUISITE_ENCOUNTER_IDS.every((encounterId) => {
      const encounter = M5_ENCOUNTERS.find((entry) => entry.id === encounterId)
      if (encounter === undefined) return false
      return createEncounterSnapshot(encounter.id, encounter.enemyIds, enemies).phase === 'complete'
    })
    const result = this.worldRuntime.tryReachFinalGate(
      this.playerState.position,
      prerequisitesComplete,
    )
    if (result.accepted && result.changed) this.markPersistentChange()
  }

  private enemyContactRuntimeFor(enemyId: string): CombatContactRuntime {
    const existing = this.enemyContactRuntimes.get(enemyId)
    if (existing !== undefined) return existing
    const created = new CombatContactRuntime()
    this.enemyContactRuntimes.set(enemyId, created)
    return created
  }

  private enterPlayerDefeatedState(): void {
    const dropped = this.echoesRuntime.dropAll()
    this.echoRecoveryRuntime.dropAt(
      resolveConnectedRecoveryPosition(this.playerState.position),
      dropped,
    )
    this.resetPlayerActionState()
    this.playerState = stopPlayerMotor(this.playerState)
    this.markPersistentChange()
  }

  private resetPlayerActionState(): void {
    this.combatRuntime.reset()
    this.defenseRuntime.reset()
    this.contactRuntime.reset()
    this.flaskRuntime.cancelCommittedUse()
    this.skillRuntime.resetTransient()
    this.attackExecutionFacing = null
  }
}
