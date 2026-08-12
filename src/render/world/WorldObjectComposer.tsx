import { useLayoutEffect, useMemo, useRef } from 'react'
import { Object3D, type InstancedMesh } from 'three'
import {
  groupPlacementsByObjectId,
  placementTransformMatrixInputs,
  resolveInstancedWorldObject,
  resolveWorldObjectDefinition,
} from './worldObjectRegistry'
import type { OssuaryObjectId, WorldObjectPlacement } from './worldObjectTypes'
import { CorridorBell } from './ossuary/landmarks/CorridorBell'
import { CombatVeilMonolith } from './ossuary/landmarks/CombatVeilMonolith'
import { ReliquaryPlinth } from './ossuary/landmarks/ReliquaryPlinth'
import { VeilWispMotion } from './ossuary/dressing/VeilWispMotion'

function InstancedObjectGroup({
  objectId,
  placements,
}: {
  readonly objectId: OssuaryObjectId
  readonly placements: readonly WorldObjectPlacement[]
}) {
  const resolved = resolveInstancedWorldObject(objectId)
  const ref = useRef<InstancedMesh>(null)
  const transforms = useMemo(
    () => placements.map((placement) => placementTransformMatrixInputs(placement)),
    [placements],
  )

  useLayoutEffect(() => {
    const mesh = ref.current
    if (mesh === null) return
    const transform = new Object3D()
    transforms.forEach((entry, index) => {
      transform.position.set(entry.position[0], entry.position[1], entry.position[2])
      transform.rotation.set(entry.rotation[0], entry.rotation[1], entry.rotation[2])
      transform.scale.set(entry.scale[0], entry.scale[1], entry.scale[2])
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [transforms])

  return (
    <instancedMesh
      ref={ref}
      name={`world-object.${objectId}`}
      args={[resolved.geometry, resolved.material, placements.length]}
      castShadow={resolved.definition.castShadow}
      receiveShadow={resolved.definition.receiveShadow}
      frustumCulled
    />
  )
}

function UniqueObject({ placement }: { readonly placement: WorldObjectPlacement }) {
  switch (placement.objectId) {
    case 'ossuary.landmark.veil-monolith':
      return <CombatVeilMonolith placement={placement} />
    case 'ossuary.landmark.reliquary-plinth':
      return <ReliquaryPlinth placement={placement} />
    case 'ossuary.corridor.bell':
      return <CorridorBell placement={placement} />
    default:
      throw new Error(`No unique renderer registered for "${placement.objectId}"`)
  }
}

/** Renders declarative placements through registry-resolved object types. */
export function WorldObjectComposer({
  placements,
}: {
  readonly placements: readonly WorldObjectPlacement[]
}) {
  const instanced = placements.filter(
    (placement) => resolveWorldObjectDefinition(placement.objectId).renderMode === 'instanced',
  )
  const unique = placements.filter(
    (placement) => resolveWorldObjectDefinition(placement.objectId).renderMode === 'unique',
  )
  const groups = groupPlacementsByObjectId(instanced)
  const wispPlacements = groups.get('ossuary.wisp') ?? []
  const otherGroups = [...groups.entries()].filter(([objectId]) => objectId !== 'ossuary.wisp')

  return (
    <group>
      {otherGroups.map(([objectId, groupPlacements]) => (
        <InstancedObjectGroup key={objectId} objectId={objectId} placements={groupPlacements} />
      ))}
      {wispPlacements.length > 0 ? (
        <VeilWispMotion>
          <InstancedObjectGroup objectId="ossuary.wisp" placements={wispPlacements} />
        </VeilWispMotion>
      ) : null}
      {unique.map((placement) => (
        <UniqueObject key={placement.instanceId} placement={placement} />
      ))}
    </group>
  )
}
