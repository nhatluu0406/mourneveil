import type { OssuaryObjectId, OssuaryRouteArea, WorldObjectPlacement } from './worldObjectTypes'

const ZERO = Object.freeze([0, 0, 0] as const)

export function instance(
  instanceId: string,
  objectId: OssuaryObjectId,
  area: OssuaryRouteArea,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = ZERO,
  scale?: readonly [number, number, number],
  variant?: string,
  supportInstanceId?: string,
): WorldObjectPlacement {
  return Object.freeze({
    instanceId,
    objectId,
    area,
    position: Object.freeze(position),
    rotation: Object.freeze(rotation),
    ...(scale === undefined ? {} : { scale: Object.freeze(scale) }),
    ...(variant === undefined ? {} : { variant }),
    ...(supportInstanceId === undefined ? {} : { supportInstanceId }),
  })
}
