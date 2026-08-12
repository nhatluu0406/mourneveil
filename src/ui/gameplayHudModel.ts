import type { GameRuntimeSnapshot } from '../game/runtime/GameRuntime'
import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from '../game/world/checkpoint'
import {
  MOURNEVEIL_CONNECTED_LEVEL,
  type MourneveilZoneId,
} from '../game/world/connectedLevel'
import { getItemDefinition } from '../game/items/itemDefinition'

export type GameplayInteractionPrompt =
  | 'F — Rest'
  | 'F — Open shortcut'
  | 'R — Respawn'
  | null

export const THREAT_PRESENTATION_RANGE = 7.5

export interface ZoneHudCopy {
  readonly eyebrow: string
  readonly title: string
  readonly objective: string
}

export type EquipmentBarIcon = 'oathblade' | 'charm' | 'flask' | 'echo'

export interface EquipmentBarSlot {
  readonly id: 'weapon' | 'charm' | 'flask' | 'echoes'
  readonly label: string
  readonly detail: string
  readonly binding: 'LMB' | 'E' | null
  readonly icon: EquipmentBarIcon
  readonly equipped: boolean
}

const ZONE_COPY: Readonly<Record<MourneveilZoneId, ZoneHudCopy>> = Object.freeze({
  'zone.arrival': {
    eyebrow: 'The Mourneveil · Rite I',
    title: 'Ashen Threshold',
    objective: 'Cross the dead approach and find the first breach.',
  },
  'zone.first-combat': {
    eyebrow: 'Outer Watch · Rite I',
    title: 'The Unburied Watch',
    objective: 'Break the sentries and follow the veil-lit corridor.',
  },
  'zone.checkpoint': {
    eyebrow: 'Refuge · Rite I',
    title: 'Reliquary of the Veil',
    objective: 'Rest at the reliquary. The path bends beyond the ossuary ribs.',
  },
  'zone.mixed-combat': {
    eyebrow: 'Sunken Court · Rite I',
    title: 'Court of Quiet Names',
    objective: 'Clear the court and open the route toward the final approach.',
  },
  'zone.final-approach': {
    eyebrow: 'Final Approach · Rite I',
    title: 'Ash Walk',
    objective: 'Reach the sealed gate and survive the last watch.',
  },
  'zone.final-arena': {
    eyebrow: 'Final Arena · Rite I',
    title: 'The Veilbound Sepulchre',
    objective: 'End the rite. Leave no watcher standing.',
  },
})

function horizontalDistance(
  left: { readonly x: number; readonly z: number },
  right: { readonly x: number; readonly z: number },
): number {
  return Math.hypot(left.x - right.x, left.z - right.z)
}

export function resolveZoneHudCopy(zoneId: MourneveilZoneId | null): ZoneHudCopy {
  if (zoneId !== null) return ZONE_COPY[zoneId]
  return {
    eyebrow: 'Mourneveil · Rite I',
    title: 'Between Reliquaries',
    objective: 'Find the next veil-lit path.',
  }
}

export function resolveNearestThreat(
  snapshot: GameRuntimeSnapshot,
  range = THREAT_PRESENTATION_RANGE,
): GameRuntimeSnapshot['enemies'][number] | null {
  const nearest =
    snapshot.enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => ({
        enemy,
        distance: horizontalDistance(enemy.position, snapshot.player.position),
      }))
      .sort((left, right) => left.distance - right.distance)[0] ?? null
  if (nearest === null || nearest.distance > range) return null
  return nearest.enemy
}

export function threatTitle(definitionId: string): string {
  if (definitionId.includes('boss')) return 'THE VEILBOUND SEPULCHRE'
  return definitionId.includes('brute') ? 'OSSUARY BULWARK' : 'VEIL-RIVEN STALKER'
}

export function threatSubtitle(definitionId: string): string {
  if (definitionId.includes('boss')) return 'THE LAST OSSUARY WARDEN'
  return definitionId.includes('brute') ? 'THE IRON DEAD · UNYIELDING' : 'THE UNBURIED · HUNTING'
}

export function isBossThreat(definitionId: string): boolean {
  return definitionId.includes('boss')
}

export function resolveGameplayInteractionPrompt(
  snapshot: GameRuntimeSnapshot,
): GameplayInteractionPrompt {
  if (!snapshot.playerHealth.health.alive) {
    return snapshot.checkpoint.activated ? 'R — Respawn' : null
  }

  const player = snapshot.player.position
  if (
    horizontalDistance(player, CONNECTED_LEVEL_CHECKPOINT_DEFINITION.interactionPosition) <=
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

/** Content-first HUD projection. Every value comes from canonical runtime state. */
export function resolveEquipmentBar(snapshot: GameRuntimeSnapshot): readonly EquipmentBarSlot[] {
  const weapon = equippedWeaponLabel(snapshot)
  const charm = equippedCharmLabel(snapshot)
  return Object.freeze([
    Object.freeze({
      id: 'weapon' as const,
      label: weapon,
      detail: snapshot.equipment.weaponItemId === null ? 'Weapon slot empty' : `Power ${Math.max(snapshot.resolvedAttackDamage.light, snapshot.resolvedAttackDamage.heavy)}`,
      binding: 'LMB' as const,
      icon: 'oathblade' as const,
      equipped: snapshot.equipment.weaponItemId !== null,
    }),
    Object.freeze({
      id: 'charm' as const,
      label: charm ?? 'Empty Charm Socket',
      detail:
        charm === null
          ? 'No charm equipped'
          : `HP ${snapshot.playerHealth.health.maximum} · Guard ${snapshot.defense.guardImpactThreshold}`,
      binding: null,
      icon: 'charm' as const,
      equipped: charm !== null,
    }),
    Object.freeze({
      id: 'flask' as const,
      label: 'Ashen Flask',
      detail: `${snapshot.flask.currentCharges} / ${snapshot.flask.maximumCharges} charges`,
      binding: 'E' as const,
      icon: 'flask' as const,
      equipped: snapshot.flask.currentCharges > 0,
    }),
    Object.freeze({
      id: 'echoes' as const,
      label: 'Veil Residue',
      detail: `${snapshot.echoes.carried} Echoes`,
      binding: null,
      icon: 'echo' as const,
      equipped: snapshot.echoes.carried > 0,
    }),
  ])
}
