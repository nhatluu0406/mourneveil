import type { Vector3Value } from '../character/playerMotor'

export const MOURNEVEIL_LEVEL_ID = 'level.mourneveil.connected-graybox' as const

export const MOURNEVEIL_ZONE_IDS = [
  'zone.arrival',
  'zone.first-combat',
  'zone.checkpoint',
  'zone.mixed-combat',
  'zone.final-approach',
  'zone.final-arena',
] as const

export type MourneveilZoneId = (typeof MOURNEVEIL_ZONE_IDS)[number]

export const MOURNEVEIL_CONNECTION_IDS = [
  'connection.arrival-first-combat',
  'connection.first-combat-checkpoint',
  'connection.checkpoint-mixed-long',
  'connection.shortcut-checkpoint-mixed',
  'connection.mixed-final-approach',
  'connection.gate-final-arena',
] as const

export type MourneveilConnectionId = (typeof MOURNEVEIL_CONNECTION_IDS)[number]
export type WorldConnectionKind = 'open' | 'gated' | 'shortcut'

export interface ZoneBounds {
  readonly minimumX: number
  readonly maximumX: number
  readonly minimumZ: number
  readonly maximumZ: number
}

export interface GrayboxZonePresentation {
  readonly label: string
  readonly floorColor: string
}

export interface WorldZoneDefinition {
  readonly id: MourneveilZoneId
  readonly bounds: ZoneBounds
  readonly entryPosition?: Vector3Value
  readonly encounterId?: string
  readonly checkpointId?: string
  readonly connectionIds: readonly MourneveilConnectionId[]
  readonly presentation: GrayboxZonePresentation
}

export interface WorldConnectionDefinition {
  readonly id: MourneveilConnectionId
  readonly kind: WorldConnectionKind
  readonly fromZoneId: MourneveilZoneId
  readonly toZoneId: MourneveilZoneId
  readonly worldPosition: Vector3Value
  readonly interactionRange?: number
  readonly unlockFromZoneId?: MourneveilZoneId
}

export interface ConnectedLevelDefinition {
  readonly id: typeof MOURNEVEIL_LEVEL_ID
  readonly entryZoneId: MourneveilZoneId
  readonly entryPosition: Vector3Value
  readonly zones: readonly WorldZoneDefinition[]
  readonly connections: readonly WorldConnectionDefinition[]
}

export const MOURNEVEIL_CONNECTED_LEVEL: ConnectedLevelDefinition = Object.freeze({
  id: MOURNEVEIL_LEVEL_ID,
  entryZoneId: 'zone.arrival',
  entryPosition: Object.freeze({ x: -14, y: 0.82, z: 6 }),
  zones: Object.freeze([
    defineZone('zone.arrival', [-16, -11, 3, 9], [
      'connection.arrival-first-combat',
    ], '#3a4a42', { entryPosition: { x: -14, y: 0.82, z: 6 }, label: 'Arrival' }),
    defineZone('zone.first-combat', [-12, -7, 0, 5], [
      'connection.arrival-first-combat',
      'connection.first-combat-checkpoint',
    ], '#46584a', { encounterId: 'encounter.m5.introduction', label: 'Outer Watch' }),
    defineZone('zone.checkpoint', [-8, -4, -2, 2], [
      'connection.first-combat-checkpoint',
      'connection.checkpoint-mixed-long',
      'connection.shortcut-checkpoint-mixed',
    ], '#455a5e', { checkpointId: 'checkpoint.m5.refuge', label: 'Refuge' }),
    defineZone('zone.mixed-combat', [-2, 4, -7, -1], [
      'connection.checkpoint-mixed-long',
      'connection.shortcut-checkpoint-mixed',
      'connection.mixed-final-approach',
    ], '#42382f', { encounterId: 'encounter.m5.mixed', label: 'Sunken Court' }),
    defineZone('zone.final-approach', [4, 10, -7, -1], [
      'connection.mixed-final-approach',
      'connection.gate-final-arena',
    ], '#3c3131', { encounterId: 'encounter.m5.pressure', label: 'Ash Walk' }),
    defineZone('zone.final-arena', [10, 16, -8, 0], [
      'connection.gate-final-arena',
    ], '#332a35', { label: 'Sealed Arena' }),
  ]),
  connections: Object.freeze([
    defineConnection('connection.arrival-first-combat', 'open', 'zone.arrival', 'zone.first-combat', -11, 5),
    defineConnection('connection.first-combat-checkpoint', 'open', 'zone.first-combat', 'zone.checkpoint', -8, 1),
    defineConnection('connection.checkpoint-mixed-long', 'open', 'zone.checkpoint', 'zone.mixed-combat', -5, -4),
    defineConnection(
      'connection.shortcut-checkpoint-mixed',
      'shortcut',
      'zone.checkpoint',
      'zone.mixed-combat',
      -3,
      -1,
      { interactionRange: 1.25, unlockFromZoneId: 'zone.mixed-combat' },
    ),
    defineConnection('connection.mixed-final-approach', 'open', 'zone.mixed-combat', 'zone.final-approach', 4, -4),
    defineConnection(
      'connection.gate-final-arena',
      'gated',
      'zone.final-approach',
      'zone.final-arena',
      10,
      -4,
      { interactionRange: 1.5 },
    ),
  ]),
})

export function validateConnectedLevelDefinition(definition: ConnectedLevelDefinition): void {
  const zoneIds = new Set<string>()
  const connectionIds = new Set<string>()
  for (const zone of definition.zones) {
    if (zoneIds.has(zone.id)) throw new Error(`Duplicate world zone ID: ${zone.id}`)
    zoneIds.add(zone.id)
    assertBounds(zone.bounds, zone.id)
  }
  if (!zoneIds.has(definition.entryZoneId)) {
    throw new Error(`Missing entry zone: ${definition.entryZoneId}`)
  }
  for (const connection of definition.connections) {
    if (connectionIds.has(connection.id)) {
      throw new Error(`Duplicate world connection ID: ${connection.id}`)
    }
    connectionIds.add(connection.id)
    if (!zoneIds.has(connection.fromZoneId) || !zoneIds.has(connection.toZoneId)) {
      throw new Error(`Connection ${connection.id} references a missing zone`)
    }
    if (connection.kind === 'shortcut') {
      if (connection.unlockFromZoneId === undefined || !zoneIds.has(connection.unlockFromZoneId)) {
        throw new Error(`Shortcut ${connection.id} requires a valid unlock side`)
      }
      if (connection.interactionRange === undefined || connection.interactionRange <= 0) {
        throw new Error(`Shortcut ${connection.id} requires a positive interaction range`)
      }
    }
  }
  for (const zone of definition.zones) {
    for (const connectionId of zone.connectionIds) {
      const connection = definition.connections.find((entry) => entry.id === connectionId)
      if (connection === undefined) {
        throw new Error(`Zone ${zone.id} references missing connection: ${connectionId}`)
      }
      if (connection.fromZoneId !== zone.id && connection.toZoneId !== zone.id) {
        throw new Error(`Zone ${zone.id} references unrelated connection: ${connectionId}`)
      }
    }
  }
}

function defineZone(
  id: MourneveilZoneId,
  [minimumX, maximumX, minimumZ, maximumZ]: readonly [number, number, number, number],
  connectionIds: readonly MourneveilConnectionId[],
  floorColor: string,
  options: {
    readonly label: string
    readonly entryPosition?: Vector3Value
    readonly encounterId?: string
    readonly checkpointId?: string
  },
): WorldZoneDefinition {
  return Object.freeze({
    id,
    bounds: Object.freeze({ minimumX, maximumX, minimumZ, maximumZ }),
    ...(options.entryPosition === undefined ? {} : { entryPosition: Object.freeze(options.entryPosition) }),
    ...(options.encounterId === undefined ? {} : { encounterId: options.encounterId }),
    ...(options.checkpointId === undefined ? {} : { checkpointId: options.checkpointId }),
    connectionIds: Object.freeze([...connectionIds]),
    presentation: Object.freeze({ label: options.label, floorColor }),
  })
}

function defineConnection(
  id: MourneveilConnectionId,
  kind: WorldConnectionKind,
  fromZoneId: MourneveilZoneId,
  toZoneId: MourneveilZoneId,
  x: number,
  z: number,
  options: { readonly interactionRange?: number; readonly unlockFromZoneId?: MourneveilZoneId } = {},
): WorldConnectionDefinition {
  return Object.freeze({
    id,
    kind,
    fromZoneId,
    toZoneId,
    worldPosition: Object.freeze({ x, y: 0.82, z }),
    ...options,
  })
}

function assertBounds(bounds: ZoneBounds, zoneId: string): void {
  const values = [bounds.minimumX, bounds.maximumX, bounds.minimumZ, bounds.maximumZ]
  if (!values.every(Number.isFinite) || bounds.minimumX >= bounds.maximumX || bounds.minimumZ >= bounds.maximumZ) {
    throw new Error(`Zone ${zoneId} has invalid bounds`)
  }
}
