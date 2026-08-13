import { getWorldObjectDefinition } from './objects/catalog'
import type { CompiledDungeon, WorldBoxCollider } from './dungeonTypes'
import { resolveObjectCollision, type WorldObjectPlacement } from './worldObjectTypes'

const STRUCTURAL_IDS = new Set([
  'ossuary.wall.bay',
  'ossuary.wall.parapet',
  'ossuary.floor.foundation',
  'ossuary.sarcophagus.body',
  'ossuary.gate.shortcut',
  'ossuary.gate.final',
  'ossuary.interactive.checkpoint-shrine',
  'ossuary.landmark.veil-monolith',
  'ossuary.buttress',
  'ossuary.buttress.split',
  'ossuary.rubble.cluster',
])

export interface DungeonIntegrityReport {
  readonly visibleStructuralWithoutCollider: readonly string[]
  readonly colliderWithoutVisibleStructuralOwner: readonly string[]
  readonly boundsMismatch: readonly string[]
  readonly duplicateCollider: readonly string[]
  readonly overlappingDoorBlocker: readonly string[]
  readonly unsupportedStructuralObject: readonly string[]
}

export function auditCompiledDungeon(compiled: CompiledDungeon): DungeonIntegrityReport {
  const structural = compiled.renderInstances.filter((placement) => {
    const collision = resolveObjectCollision(getWorldObjectDefinition(placement.objectId))
    return STRUCTURAL_IDS.has(placement.objectId) || collision.kind !== 'none'
  })
  const colliderIds = compiled.colliders.map((entry) => entry.id)
  const duplicateCollider = colliderIds.filter((id, index) => colliderIds.indexOf(id) !== index)

  const visibleStructuralWithoutCollider = structural
    .filter((placement) => !compiled.colliders.some((collider) => coversPlacement(collider, placement)))
    .filter((placement) => resolveObjectCollision(getWorldObjectDefinition(placement.objectId)).kind !== 'none')
    .map((placement) => placement.instanceId)

  const colliderWithoutVisibleStructuralOwner = compiled.colliders
    .filter((collider) => collider.kind !== 'floor')
    .filter((collider) => {
      const owner = collider.ownerInstanceId
      if (owner === undefined) return true
      return !compiled.renderInstances.some((placement) => placement.instanceId === owner)
    })
    .map((collider) => collider.id)

  const boundsMismatch = structural.flatMap((placement) => {
    const collider = compiled.colliders.find((entry) => coversPlacement(entry, placement))
    if (collider === undefined) return []
    if (placement.objectId === 'ossuary.floor.foundation') return []
    if (!xzOverlaps(placement, collider)) return [placement.instanceId]
    return []
  })

  const overlappingDoorBlocker = compiled.colliders
    .filter((collider) => collider.kind === 'wall' || collider.kind === 'blocker')
    .filter((collider) =>
      compiled.renderInstances.some(
        (placement) =>
          (placement.objectId === 'ossuary.gate.shortcut' || placement.objectId === 'ossuary.gate.final') &&
          sameCenter(placement.position, collider.position, 0.35) &&
          collider.kind === 'wall',
      ),
    )
    .map((collider) => collider.id)

  const unsupportedStructuralObject = compiled.renderInstances
    .filter((placement) => placement.objectId.startsWith('ossuary.wall.') || placement.objectId.startsWith('ossuary.floor.foundation'))
    .filter((placement) => resolveObjectCollision(getWorldObjectDefinition(placement.objectId)).kind === 'none')
    .map((placement) => placement.instanceId)

  return Object.freeze({
    visibleStructuralWithoutCollider,
    colliderWithoutVisibleStructuralOwner,
    boundsMismatch,
    duplicateCollider,
    overlappingDoorBlocker,
    unsupportedStructuralObject,
  })
}

function coversPlacement(collider: WorldBoxCollider, placement: WorldObjectPlacement): boolean {
  if (collider.ownerInstanceId === placement.instanceId || collider.id === placement.instanceId) return true
  if (placement.objectId !== 'ossuary.wall.bay' && placement.objectId !== 'ossuary.wall.parapet') return false
  return xzOverlaps(placement, collider)
}

function xzOverlaps(
  placement: WorldObjectPlacement,
  collider: WorldBoxCollider,
): boolean {
  const dx = Math.abs(placement.position[0] - collider.position[0])
  const dz = Math.abs(placement.position[2] - collider.position[2])
  return dx <= collider.size[0] / 2 + 0.35 && dz <= collider.size[2] / 2 + 0.35
}

function sameCenter(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
  epsilon: number,
): boolean {
  return Math.hypot(left[0] - right[0], left[2] - right[2]) <= epsilon
}
