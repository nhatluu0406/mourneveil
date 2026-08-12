import { forwardRef, type RefObject } from 'react'
import type { Group, Mesh } from 'three'
import { createTaperedPrismGeometry } from '../productionGeometry'
import { SEPULCHRE_MATERIALS } from './sepulchreSharedMaterials'
import { SepulchreHeadpiece } from './SepulchreHeadpiece'

const TORSO = createTaperedPrismGeometry({ bottomWidth: 0.72, topWidth: 1.02, height: 1.22, depth: 0.58 })
const PLATE = createTaperedPrismGeometry({ bottomWidth: 0.64, topWidth: 0.82, height: 0.92, depth: 0.1 })

export const SepulchreBody = forwardRef<Group, {
  readonly leftPlateRef: RefObject<Group | null>
  readonly rightPlateRef: RefObject<Group | null>
  readonly coreRef: RefObject<Mesh | null>
}>(function SepulchreBody({ leftPlateRef, rightPlateRef, coreRef }, ref) {
  return (
    <group ref={ref} position={[0, 0.18, 0]}>
      <mesh castShadow receiveShadow geometry={TORSO} material={SEPULCHRE_MATERIALS.innerIron} />
      <group ref={leftPlateRef} position={[-0.25, 0.04, -0.34]}>
        <mesh castShadow rotation={[0.04, 0, -0.03]} scale={[0.54, 1, 1]} geometry={PLATE} material={SEPULCHRE_MATERIALS.mortuaryPlate} />
      </group>
      <group ref={rightPlateRef} position={[0.25, 0.04, -0.34]}>
        <mesh castShadow rotation={[0.04, 0, 0.03]} scale={[0.54, 1, 1]} geometry={PLATE} material={SEPULCHRE_MATERIALS.mortuaryPlate} />
      </group>
      <mesh ref={coreRef} position={[0, 0.08, -0.43]} rotation={[Math.PI / 4, 0, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <primitive attach="material" object={SEPULCHRE_MATERIALS.veilCore} />
      </mesh>
      <mesh castShadow position={[0, 0.05, 0.36]} scale={[1.1, 1.12, 1]}>
        <torusGeometry args={[0.48, 0.085, 6, 22, Math.PI]} />
        <primitive attach="material" object={SEPULCHRE_MATERIALS.bone} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh castShadow position={[side * 0.68, 0.45, 0]} rotation={[0, 0, side * -0.18]}>
            <dodecahedronGeometry args={[0.34, 0]} />
            <primitive attach="material" object={side < 0 ? SEPULCHRE_MATERIALS.shoulderBone : SEPULCHRE_MATERIALS.bronze} />
          </mesh>
          <mesh castShadow position={[side * 0.46, -0.72, 0.02]} rotation={[0, 0, side * 0.08]}>
            <cylinderGeometry args={[0.16, 0.22, 0.78, 7]} />
            <primitive attach="material" object={SEPULCHRE_MATERIALS.innerIron} />
          </mesh>
        </group>
      ))}
      <SepulchreHeadpiece />
    </group>
  )
})
