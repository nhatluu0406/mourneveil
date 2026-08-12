import type { GameRuntimeSnapshot } from '../game/runtime/GameRuntime'
import { CONNECTED_LEVEL_CHECKPOINT_DEFINITION } from '../game/world/checkpoint'
import {
  MOURNEVEIL_CONNECTED_LEVEL,
  type MourneveilZoneId,
} from '../game/world/connectedLevel'
import { BOSS_TECHNICAL_ID } from '../game/enemies/bossKit'
import { getItemDefinition } from '../game/items/itemDefinition'
import {
  getSkillDefinition,
  SKILL_INPUT_BINDING_LABEL,
  type SkillId,
} from '../game/skills/skillDefinition'

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

export type EquipmentBarIcon = 'oathblade' | 'vitality-charm' | 'ward-seal' | 'charm' | 'flask' | 'echo'

export interface EquipmentBarSlot {
  readonly id: 'weapon' | 'charm' | 'flask' | 'echoes'
  readonly label: string
  readonly detail: string
  readonly binding: 'LMB' | 'E' | null
  readonly icon: EquipmentBarIcon
  readonly equipped: boolean
}

export interface SkillHudSlot {
  readonly skillId: SkillId | null
  readonly label: string
  readonly detail: string
  readonly binding: typeof SKILL_INPUT_BINDING_LABEL
  readonly ready: boolean
  readonly cooldownRatio: number
  readonly equipped: boolean
}

export interface AcquisitionToastCopy {
  readonly title: string
  readonly detail: string
}

export interface ProgressionToastCopy {
  readonly title: string
  readonly detail: string
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

const SLICE_COMPLETE_COPY: ZoneHudCopy = Object.freeze({
  eyebrow: 'Rite I · Complete',
  title: 'The Veilbound Sepulchre',
  objective: 'Rite complete. The Sepulchre is still. Save and rest when ready.',
})

function horizontalDistance(
  left: { readonly x: number; readonly z: number },
  right: { readonly x: number; readonly z: number },
): number {
  return Math.hypot(left.x - right.x, left.z - right.z)
}

export function isVerticalSliceComplete(
  snapshot: Pick<GameRuntimeSnapshot, 'world'>,
): boolean {
  return snapshot.world.defeatedBossIds.includes(BOSS_TECHNICAL_ID)
}

export function resolveZoneHudCopy(
  zoneId: MourneveilZoneId | null,
  snapshot?: Pick<GameRuntimeSnapshot, 'world'>,
): ZoneHudCopy {
  if (snapshot !== undefined && isVerticalSliceComplete(snapshot)) {
    return SLICE_COMPLETE_COPY
  }
  if (zoneId !== null) return ZONE_COPY[zoneId]
  return {
    eyebrow: 'Mourneveil · Rite I',
    title: 'Between Reliquaries',
    objective: 'Find the next veil-lit path.',
  }
}

export function resolveAcquisitionToast(
  snapshot: GameRuntimeSnapshot,
): AcquisitionToastCopy | null {
  const acquisition = snapshot.lastLootAcquisition
  if (acquisition === null) return null
  if (acquisition.kind === 'echoes') {
    const name =
      acquisition.itemId === null
        ? null
        : getItemDefinition(acquisition.itemId)?.displayName ?? null
    return {
      title: name === null ? `Echoes +${acquisition.echoesGained}` : `Duplicate ${name}`,
      detail:
        name === null
          ? 'Authored loot pool already claimed'
          : `Already owned · +${acquisition.echoesGained} Echoes`,
    }
  }
  if (acquisition.itemId === null) return null
  const definition = getItemDefinition(acquisition.itemId)
  if (definition === null) return null
  const equipped =
    definition.slot === 'weapon'
      ? snapshot.equipment.weaponItemId === acquisition.itemId
      : definition.slot === 'charm'
        ? snapshot.equipment.charmItemId === acquisition.itemId
        : true
  const detail =
    definition.slot === null
      ? definition.description
      : equipped
        ? 'Added to inventory'
        : 'Press I to equip'
  return {
    title: `Acquired ${definition.displayName}`,
    detail,
  }
}

export function resolveProgressionToast(
  snapshot: GameRuntimeSnapshot,
): ProgressionToastCopy | null {
  const feedback = snapshot.lastProgressionFeedback
  if (feedback === null || feedback.experienceGained <= 0) return null
  const progression = snapshot.progression
  if (feedback.levelsGained > 0) {
    return {
      title: `Veilbound · Level ${progression.level}`,
      detail:
        feedback.pointsGained > 0
          ? `+${feedback.experienceGained} XP · ${progression.unspentPoints} point${progression.unspentPoints === 1 ? '' : 's'} available`
          : `+${feedback.experienceGained} XP`,
    }
  }
  return {
    title: `+${feedback.experienceGained} XP`,
    detail:
      progression.experienceToNextLevel === null
        ? 'Max level'
        : `${progression.experienceToNextLevel} to next level`,
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
      icon:
        snapshot.equipment.charmItemId === 'item.charm.vitality'
          ? ('vitality-charm' as const)
          : snapshot.equipment.charmItemId === 'item.charm.ward-seal'
            ? ('ward-seal' as const)
            : ('charm' as const),
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

/** Compact adjacent skill slot projection — cooldown is simulation-owned. */
export function resolveSkillHudSlot(snapshot: GameRuntimeSnapshot): SkillHudSlot {
  const skills = snapshot.skills
  const definition =
    skills.equippedSkillId === null ? null : getSkillDefinition(skills.equippedSkillId)
  return Object.freeze({
    skillId: skills.equippedSkillId,
    label: definition?.displayName ?? 'No Oath Bound',
    detail: skills.ready
      ? 'Ready'
      : skills.cooldownRemainingSteps > 0
        ? `Cooldown ${skills.cooldownRemainingSteps}`
        : skills.actionPhase !== 'idle'
          ? 'Active'
          : 'Unavailable',
    binding: SKILL_INPUT_BINDING_LABEL,
    ready: skills.ready,
    cooldownRatio: skills.cooldownRatio,
    equipped: skills.equippedSkillId !== null,
  })
}
