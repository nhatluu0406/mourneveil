import type { GameRuntimeSnapshot } from '../game/runtime/GameRuntime'
import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from '../game/world/checkpoint'
import { MOURNEVEIL_CONNECTED_LEVEL } from '../game/world/connectedLevel'
import { getItemDefinition } from '../game/items/itemDefinition'

export type GameplayInteractionPrompt =
  | 'F — Rest'
  | 'F — Open shortcut'
  | 'R — Respawn'
  | null

function horizontalDistance(
  left: { readonly x: number; readonly z: number },
  right: { readonly x: number; readonly z: number },
): number {
  return Math.hypot(left.x - right.x, left.z - right.z)
}

export function resolveGameplayInteractionPrompt(
  snapshot: GameRuntimeSnapshot,
): GameplayInteractionPrompt {
  if (!snapshot.playerHealth.health.alive) {
    return snapshot.checkpoint.activated ? 'R — Respawn' : null
  }

  const player = snapshot.player.position
  if (
    horizontalDistance(player, CONNECTED_LEVEL_CHECKPOINT_DEFINITION.respawnPosition) <=
    CONNECTED_LEVEL_CHECKPOINT_DEFINITION.activationRange
  ) {
    return 'F — Rest'
  }

  const shortcut = MOURNEVEIL_CONNECTED_LEVEL.connections.find(
    (connection) => connection.id === 'connection.shortcut-checkpoint-mixed',
  )
  if (
    shortcut !== undefined &&
    shortcut.interactionRange !== undefined &&
    !snapshot.world.openedShortcutIds.includes(shortcut.id) &&
    snapshot.world.currentZoneId === shortcut.unlockFromZoneId &&
    horizontalDistance(player, shortcut.worldPosition) <= shortcut.interactionRange
  ) {
    return 'F — Open shortcut'
  }

  return null
}

export function equippedWeaponLabel(snapshot: GameRuntimeSnapshot): string {
  const id = snapshot.equipment.weaponItemId
  if (id === null) return 'Unarmed'
  return getItemDefinition(id)?.displayName ?? 'Weapon'
}

export function equippedCharmLabel(snapshot: GameRuntimeSnapshot): string | null {
  const id = snapshot.equipment.charmItemId
  if (id === null) return null
  return getItemDefinition(id)?.displayName ?? 'Charm'
}
