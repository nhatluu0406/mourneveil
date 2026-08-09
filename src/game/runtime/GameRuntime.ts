import type { PlayerMovementIntent } from '../../input/playerMovementIntent'
import type { PlayerAttackRequest } from '../../input/playerAttackIntent'
import type { PlayerDodgeRequest } from '../../input/playerDefenseIntent'
import type {
  PlayerCheckpointInteractionRequest,
  PlayerRespawnRequest,
  PlayerWorldInteractionRequest,
} from '../../input/playerRecoveryIntent'
import type { PlayerFlaskUseRequest } from '../../input/playerFlaskIntent'
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
  resolveIncomingMeleeDefense,
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
  connectedEnemyPlacementByRuntimeId,
  createConnectedLevelEnemyRuntimes,
} from '../encounters/connectedLevelEncounters'
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
  createDefaultSaveV2,
  type SaveFileV2,
} from '../save/saveSchema'
import {
  ConnectedWorldRuntime,
  type ConnectedWorldSnapshot,
  type ShortcutOpenResult,
} from '../world/connectedWorldRuntime'
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
  readonly world: ConnectedWorldSnapshot
  readonly resolvedAttackDamage: {
    readonly light: number
    readonly heavy: number
  }
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
    ],
  )
  private readonly defenseRuntime = new PlayerDefenseRuntime()
  private readonly contactRuntime = new CombatContactRuntime()
  private readonly enemyContactRuntimes = new Map<string, CombatContactRuntime>()
  private readonly trainingTargetRuntime = new TrainingTargetRuntime()
  private readonly checkpointRuntime = new CheckpointRuntime()
  private readonly flaskRuntime = new PlayerFlaskRuntime()
  private readonly echoesRuntime = new EchoesCurrencyRuntime()
  private readonly echoRecoveryRuntime = new EchoRecoveryRuntime()
  private readonly inventoryRuntime = new PlayerInventoryRuntime()
  private readonly equipmentRuntime = new PlayerEquipmentRuntime()
  private readonly lootPickupRuntime = new LootPickupRuntime()
  private readonly worldRuntime = new ConnectedWorldRuntime()
  private readonly echoRewardedEnemyIds = new Set<string>()
  private lootInstanceCounter = 0
  private playerState = createPlayerMotorState(
    CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition,
  )
  private readonly playerHealthRuntime = new PlayerHealthRuntime(
    this.playerState.position,
  )
  private readonly enemyRuntimes: EnemyRuntime[] = createConnectedLevelEnemyRuntimes()
  private collisionResolver: CharacterCollisionResolver | null = null
  private readonly enemyCollisionResolvers = new Map<string, CharacterCollisionResolver>()
  private contactQuery: CombatContactQuery | null = null
  /** Frozen aim for the committed attack execution; null while combat is idle. */
  private attackExecutionFacing: PlayerFacingDirection | null = null
  private persistHandler: (() => void) | null = null

  setPersistHandler(handler: (() => void) | null): void {
    this.persistHandler = handler
  }

  captureSave(): SaveFileV2 {
    const checkpoint = this.checkpointRuntime.snapshot()
    const flask = this.flaskRuntime.snapshot()
    const echoes = this.echoesRuntime.snapshot()
    const recovery = this.echoRecoveryRuntime.snapshot()
    const equipment = this.equipmentRuntime.snapshot()
    const loot = this.lootPickupRuntime.snapshot()
    return {
      version: 2,
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
      },
    }
  }

  /**
   * Restores persistent facts only. Encounter enemies reset; transient combat/input cleared.
   */
  applySave(save: SaveFileV2 = createDefaultSaveV2()): void {
    this.resetPlayerActionState()
    this.playerState = createPlayerMotorState(
      CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition,
    )
    this.playerHealthRuntime.updatePosition(this.playerState.position)
    this.checkpointRuntime.restore(
      save.checkpointActivated,
      save.activeCheckpointId === CONNECTED_LEVEL_CHECKPOINT_DEFINITION.id ||
      save.activeCheckpointId === LEGACY_GRAYBOX_CHECKPOINT_ID
        ? CONNECTED_LEVEL_CHECKPOINT_DEFINITION.id
        : null,
    )
    this.worldRuntime.restore(save.world)
    this.flaskRuntime.setCharges(save.flaskCharges)
    this.echoesRuntime.setCarried(save.echoesCarried)
    this.echoRecoveryRuntime.restore(save.echoRecovery)
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
    this.syncEquipmentDerivedStats()
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
    }
    this.echoRewardedEnemyIds.clear()
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
    }
    this.echoRewardedEnemyIds.clear()
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

  equipItem(itemId: ItemId): EquipResult {
    const result = this.equipmentRuntime.equip(itemId, this.inventoryRuntime)
    if (result.accepted) {
      this.syncEquipmentDerivedStats()
      this.markPersistentChange()
    }
    return result
  }

  unequipSlot(slot: EquipSlot): UnequipResult {
    const result = this.equipmentRuntime.unequip(slot)
    if (result.accepted) {
      this.syncEquipmentDerivedStats()
      this.markPersistentChange()
    }
    return result
  }

  resolvedAttackDamage(): { readonly light: number; readonly heavy: number } {
    const modifiers = this.equipmentRuntime.resolvedModifiers()
    const light = PLAYER_ATTACK_DEFINITIONS.find((entry) => entry.kind === 'light')!
    const heavy = PLAYER_ATTACK_DEFINITIONS.find((entry) => entry.kind === 'heavy')!
    return {
      light: light.damage + modifiers.lightDamageBonus,
      heavy: heavy.damage + modifiers.heavyDamageBonus,
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
      const flaskHealAmount = this.flaskRuntime.advanceFixedStep(combat)
      if (flaskHealAmount !== null) {
        const restoration = this.playerHealthRuntime.restore(flaskHealAmount)
        this.flaskRuntime.recordRestoration(restoration.restoredHealth)
        this.markPersistentChange()
      }
      if (playerAlive && this.collisionResolver !== null) {
        const defense = this.defenseRuntime.snapshot(combat)
        if (defense.dodgeDirection !== null) {
          this.playerState = stepPlayerDodgeMotor(
            this.playerState,
            defense.dodgeDirection,
            defense.dodgeMovementActive ? PLAYER_DODGE_SPEED : 0,
            fixedStepSeconds,
            this.collisionResolver,
          )
        } else {
          const constrainedMovementIntent = constrainMovementIntentForAttack(
            {
              horizontal: movementIntent.horizontal * defense.movementScale,
              forward: movementIntent.forward * defense.movementScale,
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
          this.markPersistentChange()
        }
      }
      for (const enemyRuntime of this.enemyRuntimes) {
        advanceMeleeEnemy(
          enemyRuntime,
          this.playerState.position,
          fixedStepSeconds,
          this.enemyCollisionResolvers.get(enemyRuntime.id) ?? null,
          { targetAlive: playerAlive },
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
            targets: [this.trainingTargetRuntime, ...this.enemyRuntimes],
            query: this.contactQuery,
            damageOverride: this.resolvedDamageForAction(combatSnapshot.actionId),
          }),
        )
        this.grantEchoRewardsForDefeatedEnemies()
        this.spawnLootForDefeatedEnemies()
        if (playerAlive) {
          for (const enemyRuntime of this.enemyRuntimes) {
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
                resolveDamage: (target, damage) => {
                  const outcome = resolveIncomingMeleeDefense(
                    this.defenseRuntime.snapshot(combatSnapshot),
                    this.playerState.facing,
                    enemyAttack.executionFacing ?? enemy.facing,
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
      world: this.worldRuntime.snapshot(),
      resolvedAttackDamage: this.resolvedAttackDamage(),
    }
  }

  private resolvedDamageForAction(actionId: string | null): number | undefined {
    if (actionId === null) return undefined
    const attack = playerAttackForActionId(actionId)
    if (attack === null) return undefined
    const modifiers = this.equipmentRuntime.resolvedModifiers()
    if (attack.kind === 'light') return attack.damage + modifiers.lightDamageBonus
    return attack.damage + modifiers.heavyDamageBonus
  }

  private syncEquipmentDerivedStats(): void {
    this.playerHealthRuntime.setMaximumHealthBonus(
      this.equipmentRuntime.resolvedModifiers().maxHealthBonus,
    )
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
    for (const enemy of this.enemyRuntimes) {
      const snapshot = enemy.snapshot()
      if (snapshot.alive || this.echoRewardedEnemyIds.has(enemy.id)) continue
      this.echoRewardedEnemyIds.add(enemy.id)
      const reward = enemy.definition.echoReward
      if (reward > 0) {
        this.echoesRuntime.add(reward)
        this.markPersistentChange()
      }
    }
  }

  private updateFinalGateProgress(): void {
    const enemies = this.enemyRuntimes.map((enemy) => enemy.snapshot())
    const prerequisitesComplete = M5_ENCOUNTERS.every(
      (encounter) => createEncounterSnapshot(encounter.id, encounter.enemyIds, enemies).phase === 'complete',
    )
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
    this.echoRecoveryRuntime.dropAt(this.playerState.position, dropped)
    this.resetPlayerActionState()
    this.playerState = stopPlayerMotor(this.playerState)
    this.markPersistentChange()
  }

  private resetPlayerActionState(): void {
    this.combatRuntime.reset()
    this.defenseRuntime.reset()
    this.contactRuntime.reset()
    this.flaskRuntime.cancelCommittedUse()
    this.attackExecutionFacing = null
  }
}
