import type { Vector3Value } from '../character/playerMotor'
import {
  MOURNEVEIL_CONNECTED_LEVEL,
  type ConnectedLevelDefinition,
  type MourneveilConnectionId,
  type MourneveilZoneId,
  validateConnectedLevelDefinition,
} from './connectedLevel'

export interface ConnectedWorldFlags {
  readonly openedShortcutIds: readonly MourneveilConnectionId[]
  readonly finalGateReached: boolean
}

export interface ConnectedWorldSnapshot extends ConnectedWorldFlags {
  readonly levelId: typeof MOURNEVEIL_CONNECTED_LEVEL.id
  readonly currentZoneId: MourneveilZoneId | null
}

export type ShortcutOpenResult =
  | { readonly accepted: true; readonly shortcutId: MourneveilConnectionId; readonly changed: boolean }
  | { readonly accepted: false; readonly shortcutId: MourneveilConnectionId; readonly reason: 'unknown-shortcut' | 'wrong-side' | 'out-of-range' }

export type FinalGateReachResult =
  | { readonly accepted: true; readonly changed: boolean }
  | { readonly accepted: false; readonly reason: 'prerequisites-incomplete' | 'out-of-range' }

export class ConnectedWorldRuntime {
  private currentZoneId: MourneveilZoneId | null
  private readonly openedShortcutIds = new Set<MourneveilConnectionId>()
  private finalGateReached = false

  constructor(readonly definition: ConnectedLevelDefinition = MOURNEVEIL_CONNECTED_LEVEL) {
    validateConnectedLevelDefinition(definition)
    this.currentZoneId = definition.entryZoneId
  }

  updatePlayerPosition(position: Vector3Value): MourneveilZoneId | null {
    const zone = this.definition.zones.find(({ bounds }) =>
      position.x >= bounds.minimumX && position.x <= bounds.maximumX &&
      position.z >= bounds.minimumZ && position.z <= bounds.maximumZ,
    )
    this.currentZoneId = zone?.id ?? null
    return this.currentZoneId
  }

  openShortcut(shortcutId: MourneveilConnectionId, playerPosition: Vector3Value): ShortcutOpenResult {
    const shortcut = this.definition.connections.find(
      (connection) => connection.id === shortcutId && connection.kind === 'shortcut',
    )
    if (shortcut === undefined) {
      return { accepted: false, shortcutId, reason: 'unknown-shortcut' }
    }
    this.updatePlayerPosition(playerPosition)
    if (this.currentZoneId !== shortcut.unlockFromZoneId) {
      return { accepted: false, shortcutId, reason: 'wrong-side' }
    }
    if (horizontalDistance(playerPosition, shortcut.worldPosition) > (shortcut.interactionRange ?? 0)) {
      return { accepted: false, shortcutId, reason: 'out-of-range' }
    }
    const changed = !this.openedShortcutIds.has(shortcutId)
    this.openedShortcutIds.add(shortcutId)
    return { accepted: true, shortcutId, changed }
  }

  isConnectionOpen(connectionId: MourneveilConnectionId): boolean {
    const connection = this.definition.connections.find((entry) => entry.id === connectionId)
    if (connection === undefined) return false
    if (connection.kind === 'open') return true
    if (connection.kind === 'shortcut') return this.openedShortcutIds.has(connectionId)
    return this.finalGateReached
  }

  tryReachFinalGate(playerPosition: Vector3Value, prerequisitesComplete: boolean): FinalGateReachResult {
    if (!prerequisitesComplete) return { accepted: false, reason: 'prerequisites-incomplete' }
    const gate = this.definition.connections.find((connection) => connection.kind === 'gated')
    if (gate === undefined || horizontalDistance(playerPosition, gate.worldPosition) > (gate.interactionRange ?? 0)) {
      return { accepted: false, reason: 'out-of-range' }
    }
    const changed = !this.finalGateReached
    this.finalGateReached = true
    return { accepted: true, changed }
  }

  restore(flags: { readonly openedShortcutIds: readonly string[]; readonly finalGateReached: boolean }): void {
    this.openedShortcutIds.clear()
    const shortcutIds = new Set(
      this.definition.connections
        .filter((connection) => connection.kind === 'shortcut')
        .map((connection) => connection.id),
    )
    for (const id of flags.openedShortcutIds) {
      if (shortcutIds.has(id as MourneveilConnectionId)) {
        this.openedShortcutIds.add(id as MourneveilConnectionId)
      }
    }
    this.finalGateReached = flags.finalGateReached
  }

  snapshot(): ConnectedWorldSnapshot {
    return {
      levelId: this.definition.id,
      currentZoneId: this.currentZoneId,
      openedShortcutIds: [...this.openedShortcutIds].sort(),
      finalGateReached: this.finalGateReached,
    }
  }
}

function horizontalDistance(left: Vector3Value, right: Vector3Value): number {
  return Math.hypot(left.x - right.x, left.z - right.z)
}
