import { useFrame } from '@react-three/fiber'
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
import { PracticalLightFixture } from './ossuary/lighting/PracticalLightFixture'
import { SepulchreArenaSeal } from './ossuary/landmarks/SepulchreArenaSeal'
import {
  isPlacementOccluded,
  rebuildFadeOcclusionSolids,
} from './occlusionPlacementState'

const FADE_SCALE = 0.001
const FADE_SINK_Y = -40
const scratch = new Object3D()

function writeInstanceMatrix(
  mesh: InstancedMesh,
  index: number,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number],
  scale: readonly [number, number, number],
): void {
  scratch.position.set(position[0], position[1], position[2])
  scratch.rotation.set(rotation[0], rotation[1], rotation[2])
  scratch.scale.set(scale[0], scale[1], scale[2])
  scratch.updateMatrix()
  mesh.setMatrixAt(index, scratch.matrix)
}

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
  const fadeable = resolved.definition.occlusionPolicy === 'fade'
  const instanceIds = useMemo(() => placements.map((placement) => placement.instanceId), [placements])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (mesh === null) return
    for (let index = 0; index < transforms.length; index += 1) {
      const entry = transforms[index]!
      writeInstanceMatrix(mesh, index, entry.position, entry.rotation, entry.scale)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [transforms])

  useFrame(() => {
    if (!fadeable) return
    const mesh = ref.current
    if (mesh === null) return
    for (let index = 0; index < transforms.length; index += 1) {
      const entry = transforms[index]!
      if (isPlacementOccluded(instanceIds[index]!)) {
        writeInstanceMatrix(
          mesh,
          index,
          [entry.position[0], FADE_SINK_Y, entry.position[2]],
          entry.rotation,
          [FADE_SCALE, FADE_SCALE, FADE_SCALE],
        )
      } else {
        writeInstanceMatrix(mesh, index, entry.position, entry.rotation, entry.scale)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={ref}
      name={`world-object.${objectId}`}
      args={[resolved.geometry, resolved.material, placements.length]}
      castShadow={resolved.definition.castShadow}
      receiveShadow={resolved.definition.receiveShadow}
      frustumCulled={false}
    />
  )
}

function UniqueObject({ placement }: { readonly placement: WorldObjectPlacement }) {
  switch (placement.objectId) {
    case 'ossuary.light.wall-sconce':
    case 'ossuary.light.brazier':
    case 'ossuary.light.veil-lamp':
    case 'ossuary.light.candle-cluster':
    case 'ossuary.light.candelabrum':
    case 'ossuary.light.reliquary-lantern':
    case 'ossuary.light.double-sconce':
    case 'ossuary.light.processional-torch':
    case 'ossuary.light.ember-bowl':
    case 'ossuary.light.spectral-reliquary':
      return <PracticalLightFixture placement={placement} />
    case 'ossuary.landmark.arena-seal':
      return <SepulchreArenaSeal placement={placement} />
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
  useLayoutEffect(() => {
    rebuildFadeOcclusionSolids(placements)
  }, [placements])

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
