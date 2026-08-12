import { SEPULCHRE_MATERIALS } from './sepulchreSharedMaterials'

export function SepulchreHeadpiece() {
  return (
    <group position={[0, 1.18, 0.01]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.24, 0.3, 0.38, 7]} />
        <primitive attach="material" object={SEPULCHRE_MATERIALS.headIron} />
      </mesh>
      <mesh position={[0, 0.02, -0.235]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.19, 7]} />
        <primitive attach="material" object={SEPULCHRE_MATERIALS.headBone} />
      </mesh>
      <mesh position={[0, 0.02, -0.248]}>
        <boxGeometry args={[0.18, 0.025, 0.018]} />
        <primitive attach="material" object={SEPULCHRE_MATERIALS.veilMark} />
      </mesh>
      {[-0.42, -0.21, 0, 0.21, 0.42].map((offset, index) => (
        <mesh key={offset} castShadow position={[offset, 0.37 + (index % 2) * 0.12, 0.08]} rotation={[0, 0, -offset * 0.7]}>
          <coneGeometry args={[0.07, 0.46 + (index === 2 ? 0.16 : 0), 5]} />
          <primitive attach="material" object={index === 2 ? SEPULCHRE_MATERIALS.headBone : SEPULCHRE_MATERIALS.crownBronze} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.12, 0.14]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.48, 0.055, 6, 24, Math.PI]} />
        <primitive attach="material" object={SEPULCHRE_MATERIALS.crownBand} />
      </mesh>
    </group>
  )
}
