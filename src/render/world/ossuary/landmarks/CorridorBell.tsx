import { CylinderGeometry, TorusGeometry } from 'three'
import { getOssuaryMaterial } from '../materials'
import { resolveWorldObjectDefinition } from '../../worldObjectRegistry'
import { resolvePlacementScale, type WorldObjectPlacement } from '../../worldObjectTypes'

const BELL_BODY = new CylinderGeometry(0.16, 0.28, 0.44, 8)
const BELL_RING = new TorusGeometry(0.17, 0.045, 6, 18)

export function CorridorBell({ placement }: { readonly placement: WorldObjectPlacement }) {
  const definition = resolveWorldObjectDefinition(placement.objectId)
  const scale = resolvePlacementScale(placement, definition)
  const bronze = getOssuaryMaterial('bronze')
  const bone = getOssuaryMaterial('bone')

  return (
    <group
      position={[...placement.position]}
      rotation={[...placement.rotation]}
      scale={[...scale]}
      userData={{ instanceId: placement.instanceId }}
    >
      <mesh geometry={BELL_BODY} material={bronze} castShadow />
      <mesh geometry={BELL_RING} material={bone} position={[0, -0.28, 0]} castShadow />
    </group>
  )
}
