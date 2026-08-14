import { BoxGeometry, OctahedronGeometry } from 'three'
import { createTaperedPrismGeometry } from '../../../productionGeometry'
import { getOssuaryMaterial } from '../materials'
import { resolveWorldObjectDefinition } from '../../worldObjectRegistry'
import { resolvePlacementScale, type WorldObjectPlacement } from '../../worldObjectTypes'

const MONOLITH = createTaperedPrismGeometry({
  bottomWidth: 0.74,
  topWidth: 0.42,
  height: 1.18,
  depth: 0.62,
})
const CAP = new OctahedronGeometry(0.24, 0)
const VEIL_CRACK_A = new BoxGeometry(0.025, 0.58, 0.07)
const VEIL_CRACK_B = new BoxGeometry(0.025, 0.28, 0.075)

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
      <mesh geometry={MONOLITH} material={stone} position={[0, 0.6, 0]} castShadow receiveShadow />
      <mesh geometry={CAP} material={bone} position={[0, 1.28, 0]} scale={[0.75, 1.05, 0.75]} castShadow />
      <mesh
        geometry={VEIL_CRACK_A}
        material={veil}
        position={[0.345, 0.67, 0]}
        rotation={[0, 0, 0.34]}
        castShadow
      />
      <mesh
        geometry={VEIL_CRACK_B}
        material={veil}
        position={[0.35, 0.94, 0]}
        rotation={[0, 0, -0.46]}
        castShadow
      />
    </group>
  )
}
