import { BoxGeometry, OctahedronGeometry } from 'three'
import { createTaperedPrismGeometry } from '../../../productionGeometry'
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
const VEIL_CRACK_A = new BoxGeometry(0.035, 1.45, 0.1)
const VEIL_CRACK_B = new BoxGeometry(0.035, 0.62, 0.11)

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
      <mesh
        geometry={VEIL_CRACK_A}
        material={veil}
        position={[0.405, 1.62, 0]}
        rotation={[0, 0, 0.34]}
        castShadow
      />
      <mesh
        geometry={VEIL_CRACK_B}
        material={veil}
        position={[0.42, 2.18, 0]}
        rotation={[0, 0, -0.46]}
        castShadow
      />
      <pointLight position={[0, 2.35, 0]} intensity={3.8} distance={6.8} decay={2} color="#8aeadf" />
    </group>
  )
}
