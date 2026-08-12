import { createTaperedPrismGeometry } from '../../../productionGeometry'
import { OctahedronGeometry } from 'three'
import { getOssuaryMaterial } from '../materials'
import { resolveWorldObjectDefinition } from '../../worldObjectRegistry'
import { resolvePlacementScale, type WorldObjectPlacement } from '../../worldObjectTypes'

const PLINTH = createTaperedPrismGeometry({
  bottomWidth: 1.12,
  topWidth: 0.78,
  height: 1.56,
  depth: 1.12,
})
const CAP = new OctahedronGeometry(0.42, 0)

export function ReliquaryPlinth({ placement }: { readonly placement: WorldObjectPlacement }) {
  const definition = resolveWorldObjectDefinition(placement.objectId)
  const scale = resolvePlacementScale(placement, definition)
  const stone = getOssuaryMaterial('darkStone')
  const bone = getOssuaryMaterial('bone')
  const bronze = getOssuaryMaterial('bronze')
  const dressingForSolidId = placement.instanceId.startsWith('dressing.')
    ? placement.instanceId.slice('dressing.'.length)
    : undefined

  return (
    <group
      position={[...placement.position]}
      rotation={[...placement.rotation]}
      scale={[...scale]}
      userData={{ dressingForSolidId, instanceId: placement.instanceId }}
    >
      <mesh geometry={PLINTH} material={stone} position={[0, 0.8, 0]} castShadow receiveShadow />
      <mesh geometry={CAP} material={bone} position={[0, 1.66, 0]} scale={[0.7, 0.42, 0.7]} castShadow />
      <mesh position={[0, 0.94, 0.566]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.24, 0.035, 5, 18]} />
        <primitive attach="material" object={bronze} />
      </mesh>
      <mesh position={[0.18, 1.83, -0.02]} rotation={[0.1, 0.25, 1.2]} castShadow>
        <cylinderGeometry args={[0.11, 0.16, 0.9, 7]} />
        <primitive attach="material" object={bone} />
      </mesh>
    </group>
  )
}
