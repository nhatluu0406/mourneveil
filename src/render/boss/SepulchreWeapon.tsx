import { forwardRef } from 'react'
import type { Group } from 'three'
import { createProfilePrismGeometry } from '../productionGeometry'
import { SEPULCHRE_MATERIALS } from './sepulchreSharedMaterials'

const BLADE = createProfilePrismGeometry(
  [[-0.11, 0.08], [-0.17, -0.62], [-0.1, -1.08], [0, -1.32], [0.11, -1.05], [0.17, -0.62], [0.11, 0.08]],
  0.07,
)

export const SepulchreWeapon = forwardRef<Group>(function SepulchreWeapon(_, ref) {
  return (
    <group ref={ref} position={[0.72, 0.34, -0.25]}>
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.055, 0.07, 0.76, 8]} />
        <primitive attach="material" object={SEPULCHRE_MATERIALS.weaponIron} />
      </mesh>
      <mesh castShadow position={[0, -0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.21, 0.045, 6, 18, Math.PI]} />
        <primitive attach="material" object={SEPULCHRE_MATERIALS.weaponBronze} />
      </mesh>
      <mesh castShadow position={[0, -0.82, 0]} geometry={BLADE} material={SEPULCHRE_MATERIALS.weaponPlate} />
      <mesh position={[0, -0.82, -0.076]} scale={[0.18, 0.78, 1]}>
        <boxGeometry args={[0.12, 1.1, 0.02]} />
        <primitive attach="material" object={SEPULCHRE_MATERIALS.veilBlade} />
      </mesh>
    </group>
  )
})
