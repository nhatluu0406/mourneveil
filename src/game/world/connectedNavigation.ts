import type { Vector3Value } from '../character/playerMotor'
import {
  MOURNEVEIL_CONNECTED_LEVEL,
  type ConnectedLevelDefinition,
  type MourneveilConnectionId,
  type MourneveilZoneId,
  type WorldConnectionDefinition,
} from './connectedLevel'

export interface ConnectedNavigationNode {
  readonly id: string
  readonly zoneId: MourneveilZoneId
  readonly position: Vector3Value
  readonly connectionId: MourneveilConnectionId | null
}

export interface ConnectedNavigationRoute {
  readonly nodeIds: readonly string[]
  readonly positions: readonly Vector3Value[]
}

export interface EnemyNavigationState {
  readonly routeNodeIds: readonly string[]
  readonly routeIndex: number
}

export interface ConnectionOpenResolver {
  (connectionId: MourneveilConnectionId): boolean
}

const ZONE_CENTER_NODES: readonly ConnectedNavigationNode[] =
  MOURNEVEIL_CONNECTED_LEVEL.zones.map((zone) =>
    Object.freeze({
      id: `nav.zone.${zone.id}`,
      zoneId: zone.id,
      position: Object.freeze({
        x: (zone.bounds.minimumX + zone.bounds.maximumX) / 2,
        y: 0.82,
        z: (zone.bounds.minimumZ + zone.bounds.maximumZ) / 2,
      }),
      connectionId: null,
    }),
  )

const CONNECTION_NODES: readonly ConnectedNavigationNode[] =
  MOURNEVEIL_CONNECTED_LEVEL.connections.map((connection) =>
    Object.freeze({
      id: `nav.connection.${connection.id}`,
      zoneId: connection.fromZoneId,
      position: Object.freeze({ ...connection.worldPosition }),
      connectionId: connection.id,
    }),
  )

/** Explicit local detours around authored blockers (not a navmesh). */
const LOCAL_DETOUR_NODES: readonly ConnectedNavigationNode[] = Object.freeze([
  defineLocalNode('nav.detour.first-combat.south', 'zone.first-combat', -8.25, 2.4),
  defineLocalNode('nav.detour.first-combat.west', 'zone.first-combat', -10.2, 4.25),
  defineLocalNode('nav.detour.mixed.south', 'zone.mixed-combat', 0, -6.8),
  defineLocalNode('nav.detour.mixed.north', 'zone.mixed-combat', 2.7, -0.4),
  defineLocalNode('nav.detour.mixed.west-open', 'zone.mixed-combat', -1.4, -5.8),
  defineLocalNode('nav.detour.approach.north', 'zone.final-approach', 7.2, -3.2),
  defineLocalNode('nav.detour.checkpoint.long-route', 'zone.checkpoint', -5.5, -1.6),
])

/** Immutable authored anchors derived from the connected-level topology. */
export const CONNECTED_NAVIGATION_NODES: readonly ConnectedNavigationNode[] = Object.freeze([
  ...ZONE_CENTER_NODES,
  ...CONNECTION_NODES,
  ...LOCAL_DETOUR_NODES,
])

const NODES_BY_ID = new Map(CONNECTED_NAVIGATION_NODES.map((node) => [node.id, node]))

export function navigationNodeById(id: string): ConnectedNavigationNode | null {
  return NODES_BY_ID.get(id) ?? null
}

export function zoneIdContainingPosition(
  position: Vector3Value,
  definition: ConnectedLevelDefinition = MOURNEVEIL_CONNECTED_LEVEL,
): MourneveilZoneId | null {
  for (const zone of definition.zones) {
    if (
      position.x >= zone.bounds.minimumX &&
      position.x <= zone.bounds.maximumX &&
      position.z >= zone.bounds.minimumZ &&
      position.z <= zone.bounds.maximumZ
    ) {
      return zone.id
    }
  }
  return nearestZoneId(position, definition)
}

export function planConnectedNavigationRoute(
  from: Vector3Value,
  to: Vector3Value,
  isConnectionOpen: ConnectionOpenResolver,
  definition: ConnectedLevelDefinition = MOURNEVEIL_CONNECTED_LEVEL,
): ConnectedNavigationRoute | null {
  const fromZone = zoneIdContainingPosition(from, definition)
  const toZone = zoneIdContainingPosition(to, definition)
  if (fromZone === null || toZone === null) return null

  if (fromZone === toZone) {
    return planLocalDetour(from, to, fromZone)
  }

  const path = findOpenZonePath(fromZone, toZone, isConnectionOpen, definition)
  if (path === null || path.connections.length === 0) return null

  const nodeIds: string[] = []
  const positions: Vector3Value[] = []
  for (const connectionId of path.connections) {
    const node = CONNECTED_NAVIGATION_NODES.find(
      (entry) => entry.connectionId === connectionId,
    )
    if (node === undefined) continue
    nodeIds.push(node.id)
    positions.push({ ...node.position })
  }

  const destinationCenter = CONNECTED_NAVIGATION_NODES.find(
    (entry) => entry.id === `nav.zone.${toZone}`,
  )
  if (destinationCenter !== undefined) {
    nodeIds.push(destinationCenter.id)
    positions.push({ ...destinationCenter.position })
  }

  if (positions.length === 0) return null
  return { nodeIds: Object.freeze(nodeIds), positions: Object.freeze(positions) }
}

function planLocalDetour(
  from: Vector3Value,
  to: Vector3Value,
  zoneId: MourneveilZoneId,
): ConnectedNavigationRoute | null {
  const candidates = CONNECTED_NAVIGATION_NODES.filter((node) => node.zoneId === zoneId)
  if (candidates.length === 0) return null

  const direct = { x: to.x - from.x, z: to.z - from.z }
  const directLength = Math.hypot(direct.x, direct.z)
  let best: { readonly node: ConnectedNavigationNode; readonly score: number } | null = null
  for (const node of candidates) {
    const toNode = horizontalDistance(from, node.position)
    if (toNode < 0.55) continue
    const fromNodeToTarget = horizontalDistance(node.position, to)
    const viaLength = toNode + fromNodeToTarget
    if (directLength > 0 && viaLength < directLength * 1.02) continue
    const lateral =
      directLength === 0
        ? 0
        : Math.abs(
            ((node.position.x - from.x) * direct.z - (node.position.z - from.z) * direct.x) /
              directLength,
          )
    const score = viaLength - lateral * 0.35
    if (best === null || score < best.score) {
      best = { node, score }
    }
  }
  if (best === null) return null
  return {
    nodeIds: Object.freeze([best.node.id]),
    positions: Object.freeze([{ ...best.node.position }]),
  }
}

function defineLocalNode(
  id: string,
  zoneId: MourneveilZoneId,
  x: number,
  z: number,
): ConnectedNavigationNode {
  return Object.freeze({
    id,
    zoneId,
    position: Object.freeze({ x, y: 0.82, z }),
    connectionId: null,
  })
}

export function createEnemyNavigationState(
  route: ConnectedNavigationRoute,
): EnemyNavigationState {
  return {
    routeNodeIds: route.nodeIds,
    routeIndex: 0,
  }
}

export function currentNavigationWaypoint(
  state: EnemyNavigationState | null,
): Vector3Value | null {
  if (state === null) return null
  const nodeId = state.routeNodeIds[state.routeIndex]
  if (nodeId === undefined) return null
  const node = navigationNodeById(nodeId)
  return node === null ? null : { ...node.position }
}

export function advanceNavigationState(
  state: EnemyNavigationState,
  position: Vector3Value,
  arrivalRadius = 0.85,
): EnemyNavigationState | null {
  const waypoint = currentNavigationWaypoint(state)
  if (waypoint === null) return null
  if (horizontalDistance(position, waypoint) > arrivalRadius) {
    return state
  }
  const nextIndex = state.routeIndex + 1
  if (nextIndex >= state.routeNodeIds.length) {
    return null
  }
  return {
    routeNodeIds: state.routeNodeIds,
    routeIndex: nextIndex,
  }
}

function findOpenZonePath(
  fromZone: MourneveilZoneId,
  toZone: MourneveilZoneId,
  isConnectionOpen: ConnectionOpenResolver,
  definition: ConnectedLevelDefinition,
): { readonly connections: readonly MourneveilConnectionId[] } | null {
  const queue: Array<{
    readonly zoneId: MourneveilZoneId
    readonly connections: readonly MourneveilConnectionId[]
  }> = [{ zoneId: fromZone, connections: [] }]
  const visited = new Set<MourneveilZoneId>([fromZone])

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.zoneId === toZone) {
      return { connections: current.connections }
    }
    for (const connection of openConnectionsFrom(current.zoneId, isConnectionOpen, definition)) {
      const nextZone =
        connection.fromZoneId === current.zoneId ? connection.toZoneId : connection.fromZoneId
      if (visited.has(nextZone)) continue
      visited.add(nextZone)
      queue.push({
        zoneId: nextZone,
        connections: [...current.connections, connection.id],
      })
    }
  }
  return null
}

function openConnectionsFrom(
  zoneId: MourneveilZoneId,
  isConnectionOpen: ConnectionOpenResolver,
  definition: ConnectedLevelDefinition,
): readonly WorldConnectionDefinition[] {
  return definition.connections.filter((connection) => {
    if (connection.fromZoneId !== zoneId && connection.toZoneId !== zoneId) return false
    return isConnectionOpen(connection.id)
  })
}

function nearestZoneId(
  position: Vector3Value,
  definition: ConnectedLevelDefinition,
): MourneveilZoneId | null {
  let best: { readonly id: MourneveilZoneId; readonly distance: number } | null = null
  for (const zone of definition.zones) {
    const clamped = {
      x: clamp(position.x, zone.bounds.minimumX, zone.bounds.maximumX),
      z: clamp(position.z, zone.bounds.minimumZ, zone.bounds.maximumZ),
    }
    const distance = Math.hypot(position.x - clamped.x, position.z - clamped.z)
    if (best === null || distance < best.distance) {
      best = { id: zone.id, distance }
    }
  }
  return best?.id ?? null
}

function horizontalDistance(a: Vector3Value, b: Vector3Value): number {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
