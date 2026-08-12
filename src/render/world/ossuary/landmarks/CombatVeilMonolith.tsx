import { createTaperedPrismGeometry } from '../../../productionGeometry'
import { OctahedronGeometry } from 'three'
import { getOssuaryMaterial } from '../materials'
import { resolveWorldObjectDefinition } from '../../worldObjectRegistry'
import { resolvePlacementScale, type WorldObjectPlacement } from '../../worldObjectTypes'

const MONOLITH = createTaperedPrismGeometry({
  bottomWidth: 0.88,
  topWidth: 0.5,
  height: 2.9,
  depth: 0.78,
})
const CAP = new OctahedronGeometry(0.42, 0)

export function CombatVeilMonolith({ placement }: { readonly placement: WorldObjectPlacement }) {
  const definition = resolveWorldObjectDefinition(placement.objectId)
  const scale = resolvePlacementScale(placement, definition)
  const stone = getOssuaryMaterial('darkStone')
  const bone = getOssuaryMaterial('bone')
  const veil = getOssuaryMaterial('veil')

  return (
    <group
      position={[...placement.position]}
      rotation={[...placement.rotation]}
      scale={[...scale]}
      userData={{ landmarkId: 'landmark.combat-veil-monolith', instanceId: placement.instanceId }}
    >
      <mesh geometry={MONOLITH} material={stone} position={[0, 1.48, 0]} castShadow receiveShadow />
      <mesh geometry={CAP} material={bone} position={[0, 3.02, 0]} scale={[0.75, 1.15, 0.75]} castShadow />
      <mesh position={[0.405, 1.62, 0]} rotation={[0, 0, 0.34]} castShadow>
        <boxGeometry args={[0.035, 1.45, 0.1]} />
        <primitive attach="material" object={veil} />
      </mesh>
      <mesh position={[0.42, 2.18, 0]} rotation={[0, 0, -0.46]} castShadow>
        <boxGeometry args={[0.035, 0.62, 0.11]} />
        <primitive attach="material" object={veil} />
      </mesh>
      <pointLight position={[0, 2.35, 0]} intensity={3.8} distance={6.8} decay={2} color="#8aeadf" />
    </group>
  )
}
