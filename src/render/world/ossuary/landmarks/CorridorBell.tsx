import { getOssuaryMaterial } from '../materials'
import { resolveWorldObjectDefinition } from '../../worldObjectRegistry'
import { resolvePlacementScale, type WorldObjectPlacement } from '../../worldObjectTypes'

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
      <mesh castShadow>
        <cylinderGeometry args={[0.16, 0.28, 0.44, 8]} />
        <primitive attach="material" object={bronze} />
      </mesh>
      <mesh position={[0, -0.28, 0]} castShadow>
        <torusGeometry args={[0.17, 0.045, 6, 18]} />
        <primitive attach="material" object={bone} />
      </mesh>
    </group>
  )
}
