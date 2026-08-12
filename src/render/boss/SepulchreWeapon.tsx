import { forwardRef } from 'react'
import type { Group } from 'three'
import { createProfilePrismGeometry } from '../productionGeometry'
import { SEPULCHRE_COLORS } from './SepulchreMaterials'

const BLADE = createProfilePrismGeometry(
  [[-0.11, 0.08], [-0.17, -0.62], [-0.1, -1.08], [0, -1.32], [0.11, -1.05], [0.17, -0.62], [0.11, 0.08]],
  0.07,
)

export const SepulchreWeapon = forwardRef<Group>(function SepulchreWeapon(_, ref) {
  return (
    <group ref={ref} position={[0.72, 0.34, -0.25]}>
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.055, 0.07, 0.76, 8]} />
        <meshStandardMaterial color={SEPULCHRE_COLORS.innerIron} roughness={0.38} metalness={0.76} />
      </mesh>
      <mesh castShadow position={[0, -0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.21, 0.045, 6, 18, Math.PI]} />
        <meshStandardMaterial color={SEPULCHRE_COLORS.bronze} roughness={0.42} metalness={0.68} />
      </mesh>
      <mesh castShadow position={[0, -0.82, 0]}>
        <primitive attach="geometry" object={BLADE} />
        <meshStandardMaterial color={SEPULCHRE_COLORS.mortuaryPlate} roughness={0.3} metalness={0.72} />
      </mesh>
      <mesh position={[0, -0.82, -0.076]} scale={[0.18, 0.78, 1]}>
        <boxGeometry args={[0.12, 1.1, 0.02]} />
        <meshBasicMaterial color={SEPULCHRE_COLORS.veil} transparent opacity={0.7} />
      </mesh>
    </group>
  )
})
