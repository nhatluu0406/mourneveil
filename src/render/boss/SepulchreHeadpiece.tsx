import { SEPULCHRE_COLORS } from './SepulchreMaterials'

export function SepulchreHeadpiece() {
  return (
    <group position={[0, 1.18, 0.01]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.24, 0.3, 0.38, 7]} />
        <meshStandardMaterial color={SEPULCHRE_COLORS.innerIron} roughness={0.52} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, -0.235]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.19, 7]} />
        <meshStandardMaterial color={SEPULCHRE_COLORS.bone} roughness={0.64} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.02, -0.248]}>
        <boxGeometry args={[0.18, 0.025, 0.018]} />
        <meshStandardMaterial color={SEPULCHRE_COLORS.veil} emissive={SEPULCHRE_COLORS.veilDeep} emissiveIntensity={1.4} />
      </mesh>
      {[-0.42, -0.21, 0, 0.21, 0.42].map((offset, index) => (
        <mesh key={offset} castShadow position={[offset, 0.37 + (index % 2) * 0.12, 0.08]} rotation={[0, 0, -offset * 0.7]}>
          <coneGeometry args={[0.07, 0.46 + (index === 2 ? 0.16 : 0), 5]} />
          <meshStandardMaterial color={index === 2 ? SEPULCHRE_COLORS.bone : SEPULCHRE_COLORS.bronze} roughness={0.48} metalness={0.42} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.12, 0.14]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.48, 0.055, 6, 24, Math.PI]} />
        <meshStandardMaterial color={SEPULCHRE_COLORS.bronze} roughness={0.44} metalness={0.62} />
      </mesh>
    </group>
  )
}
