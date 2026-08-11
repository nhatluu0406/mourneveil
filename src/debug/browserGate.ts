import type { GameRuntime } from '../game/runtime/GameRuntime'
import { PLAYER_FLASK_USE_REQUEST } from '../input/playerFlaskIntent'
import type { PlayerMovementIntent } from '../input/playerMovementIntent'
import {
  PLAYER_CHECKPOINT_INTERACTION_REQUEST,
  PLAYER_RESPAWN_REQUEST,
  PLAYER_WORLD_INTERACTION_REQUEST,
} from '../input/playerRecoveryIntent'

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
  }

  return () => {
    delete window.__MOURNEVEIL_GATE__
  }
}
