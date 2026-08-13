import type { GameRuntime } from '../game/runtime/GameRuntime'
import { PLAYER_FLASK_USE_REQUEST } from '../input/playerFlaskIntent'
import { PLAYER_SKILL_USE_REQUEST } from '../input/playerSkillIntent'
import type { PlayerMovementIntent } from '../input/playerMovementIntent'
import {
  PLAYER_CHECKPOINT_INTERACTION_REQUEST,
  PLAYER_RESPAWN_REQUEST,
  PLAYER_WORLD_INTERACTION_REQUEST,
} from '../input/playerRecoveryIntent'
import { readCameraDiagnostic } from './cameraDiagnosticPublish'
import { captureMotionTelemetry, resetMotionTelemetry, setMotionTelemetryPaused } from './motionTelemetry'
import { auditScenePlacements } from '../render/world/ossuary/scenePresentation'
import { readInstanceMatrixProbe } from './instanceMatrixProbe'
import {
  readOccludedPlacementIds,
  setOcclusionOverride,
} from '../render/world/occlusionPlacementState'
import { readRendererStats } from './rendererStats'

declare global {
  interface Window {
    __MOURNEVEIL_GATE__?: {
      snapshot: () => unknown
      applyDamage: (damage: number) => void
      useFlask: () => void
      interactCheckpoint: () => void
      interactWorld: () => unknown
      respawn: () => void
      defeatEnemy: (enemyId: string) => void
      setPlayerPosition: (position: { x: number; y: number; z: number }) => void
      setPlayerFacing: (facing: { x: number; z: number }) => void
      restorePlayer: () => void
      resetMeleeFixture: () => void
      grantItem: (itemId: string) => void
      acquireItem: (itemId: string) => void
      requestAttack: (
        aimDirection: { x: number; z: number },
        attack?: 'light' | 'heavy',
      ) => unknown
      advance: (
        steps?: number,
        movement?: { horizontal: number; forward: number },
      ) => unknown
      setMovementOverride: (movement: PlayerMovementIntent | null) => void
      equipItem: (itemId: string) => unknown
      unequipSlot: (slot: 'weapon' | 'charm') => unknown
      compareItem: (itemId: string) => unknown
      allocateProgression: (attribute: string) => unknown
      equipSkill: (skillId: string) => unknown
      useSkill: () => unknown
      rendererStats: () => unknown
      cameraDiagnostic: () => unknown
      occludedPlacementIds: () => unknown
      instanceMatrixProbe: () => unknown
      forceOccludeAllFadePlacements: () => unknown
      clearOcclusionOverride: () => unknown
      motionTelemetry: () => unknown
      resetMotionTelemetry: () => unknown
      pauseMotionTelemetry: (paused: boolean) => unknown
      sceneAudit: () => unknown
    }
  }
}

export function installDevelopmentBrowserGate(runtime: GameRuntime): () => void {
  window.__MOURNEVEIL_GATE__ = {
    snapshot: () => runtime.snapshot(),
    applyDamage: (damage) => {
      runtime.applyPlayerDamage(damage)
    },
    useFlask: () => {
      runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)
    },
    interactCheckpoint: () => {
      runtime.requestCheckpointInteraction(PLAYER_CHECKPOINT_INTERACTION_REQUEST)
    },
    interactWorld: () => runtime.requestWorldInteraction(PLAYER_WORLD_INTERACTION_REQUEST),
    respawn: () => {
      runtime.requestRespawn(PLAYER_RESPAWN_REQUEST)
    },
    defeatEnemy: (enemyId) => {
      runtime.debugDefeatEnemy(enemyId)
    },
    setPlayerPosition: (position) => {
      runtime.debugSetPlayerPosition(position)
    },
    setPlayerFacing: (facing) => {
      runtime.debugSetPlayerFacing(facing)
    },
    restorePlayer: () => {
      runtime.restorePlayerForDevelopment()
    },
    resetMeleeFixture: () => {
      runtime.resetMeleeFixture()
    },
    grantItem: (itemId) => {
      runtime.debugGrantItem(itemId)
    },
    acquireItem: (itemId) => {
      runtime.debugAcquireItem(itemId)
    },
    requestAttack: (aimDirection: { x: number; z: number }, attack: 'light' | 'heavy' = 'light') =>
      runtime.requestPlayerAttack({
        type: 'player-attack',
        attack,
        aimDirection,
      }),
    advance: (steps = 1, movement = { horizontal: 0, forward: 0 }) => {
      for (let step = 0; step < steps; step += 1) {
        runtime.advanceFrame(1 / 60, movement)
      }
      return runtime.snapshot()
    },
    setMovementOverride: (movement) => {
      runtime.debugSetMovementOverride(movement)
    },
    equipItem: (itemId) => runtime.equipItem(itemId),
    unequipSlot: (slot) => runtime.unequipSlot(slot),
    compareItem: (itemId) => runtime.compareItem(itemId),
    allocateProgression: (attribute) => runtime.allocateProgression(attribute),
    equipSkill: (skillId) => runtime.equipSkill(skillId),
    useSkill: () =>
      runtime.requestPlayerSkillUse(PLAYER_SKILL_USE_REQUEST, {
        horizontal: 0,
        forward: 0,
      }),
    rendererStats: () => readRendererStats(),
    cameraDiagnostic: () => readCameraDiagnostic(),
    occludedPlacementIds: () => readOccludedPlacementIds(),
    instanceMatrixProbe: () => readInstanceMatrixProbe(),
    forceOccludeAllFadePlacements: () => {
      setOcclusionOverride('all-fade')
      return readOccludedPlacementIds()
    },
    clearOcclusionOverride: () => {
      setOcclusionOverride('auto')
      return readOccludedPlacementIds()
    },
    motionTelemetry: () => captureMotionTelemetry(),
    resetMotionTelemetry: () => {
      resetMotionTelemetry()
    },
    pauseMotionTelemetry: (paused) => {
      setMotionTelemetryPaused(Boolean(paused))
    },
    sceneAudit: () => auditScenePlacements(),
  }

  return () => {
    delete window.__MOURNEVEIL_GATE__
  }
}
