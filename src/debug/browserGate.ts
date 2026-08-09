import type { GameRuntime } from '../game/runtime/GameRuntime'
import { PLAYER_FLASK_USE_REQUEST } from '../input/playerFlaskIntent'
import {
  PLAYER_CHECKPOINT_INTERACTION_REQUEST,
  PLAYER_RESPAWN_REQUEST,
} from '../input/playerRecoveryIntent'

declare global {
  interface Window {
    __MOURNEVEIL_GATE__?: {
      snapshot: () => unknown
      applyDamage: (damage: number) => void
      useFlask: () => void
      interactCheckpoint: () => void
      respawn: () => void
      defeatEnemy: (enemyId: string) => void
      setPlayerPosition: (position: { x: number; y: number; z: number }) => void
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
    respawn: () => {
      runtime.requestRespawn(PLAYER_RESPAWN_REQUEST)
    },
    defeatEnemy: (enemyId) => {
      runtime.debugDefeatEnemy(enemyId)
    },
    setPlayerPosition: (position) => {
      runtime.debugSetPlayerPosition(position)
    },
    equipItem: (itemId) => runtime.equipItem(itemId),
    unequipSlot: (slot) => runtime.unequipSlot(slot),
  }

  return () => {
    delete window.__MOURNEVEIL_GATE__
  }
}
