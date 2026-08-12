import { forwardRef, type ReactNode } from 'react'
import {
  BoxGeometry,
  ConeGeometry,
  OctahedronGeometry,
  RingGeometry,
  TetrahedronGeometry,
  TorusGeometry,
  type Group,
} from 'three'
import { SEPULCHRE_MATERIALS } from './sepulchreSharedMaterials'

const SLASH_ARC = new TorusGeometry(1.15, 0.065, 6, 36, Math.PI * 1.15)
const SLASH_SPARK = new ConeGeometry(0.07, 0.38, 4)
const CRUSH_INNER = new RingGeometry(0.36, 0.48, 4)
const CRUSH_OUTER = new RingGeometry(0.62, 0.69, 20)
const LUNGE_SHAFT = new BoxGeometry(0.18, 0.035, 2.5)
const LUNGE_TIP = new ConeGeometry(0.26, 0.5, 3)
const SLAM_RINGS = [0.72, 1.18, 1.66].map((radius) => new RingGeometry(radius, radius + 0.065, 40))
const SLAM_SPOKE = new BoxGeometry(0.055, 1.65, 0.02)
const PHASE_SHARD = new TetrahedronGeometry(0.11, 0)
const DEFEAT_RING = new RingGeometry(0.75, 0.82, 40)
const DEFEAT_SHARD = new OctahedronGeometry(0.13, 0)

const CueRoot = forwardRef<Group, {
  readonly children: ReactNode
  readonly position: readonly [number, number, number]
  readonly rotateFloor?: boolean
}>(function CueRoot({ children, position, rotateFloor = false }, ref) {
  return (
    <group ref={ref} position={[...position]} rotation={rotateFloor ? [-Math.PI / 2, 0, 0] : undefined}>
      {children}
    </group>
  )
})

export const SepulchreSlashCue = forwardRef<Group>(function SepulchreSlashCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, -0.68, -0.18]} rotateFloor>
      <mesh rotation={[0, 0, 0.3]} geometry={SLASH_ARC} material={SEPULCHRE_MATERIALS.veilCueStrong} />
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          position={[0.45 + index * 0.28, -0.25 + index * 0.12, 0]}
          rotation={[0, 0, -0.7]}
          geometry={SLASH_SPARK}
          material={SEPULCHRE_MATERIALS.veilCue}
        />
      ))}
    </CueRoot>
  )
})

export const SepulchreCrushCue = forwardRef<Group>(function SepulchreCrushCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, -0.68, -0.9]} rotateFloor>
      <mesh rotation={[0, 0, Math.PI / 4]} geometry={CRUSH_INNER} material={SEPULCHRE_MATERIALS.funeralFire} />
      <mesh geometry={CRUSH_OUTER} material={SEPULCHRE_MATERIALS.bronzeCue} />
    </CueRoot>
  )
})

export const SepulchreLungeCue = forwardRef<Group>(function SepulchreLungeCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, -0.68, -1.25]}>
      <mesh geometry={LUNGE_SHAFT} material={SEPULCHRE_MATERIALS.veilCue} />
      <mesh position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]} geometry={LUNGE_TIP} material={SEPULCHRE_MATERIALS.veilCueStrong} />
    </CueRoot>
  )
})

export const SepulchreSlamCue = forwardRef<Group>(function SepulchreSlamCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, -0.68, 0]} rotateFloor>
      {SLAM_RINGS.map((geometry, index) => (
        <mesh
          key={index}
          geometry={geometry}
          material={index === 1 ? SEPULCHRE_MATERIALS.funeralFire : SEPULCHRE_MATERIALS.veilCue}
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <mesh
          key={index}
          rotation={[0, 0, (index * Math.PI) / 3]}
          geometry={SLAM_SPOKE}
          material={SEPULCHRE_MATERIALS.veilCueSoft}
        />
      ))}
    </CueRoot>
  )
})

export const SepulchrePhaseCue = forwardRef<Group>(function SepulchrePhaseCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, 0.3, 0]}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <mesh
          key={index}
          position={[
            Math.cos((index * Math.PI) / 3) * 0.88,
            0.2 + (index % 2) * 0.32,
            Math.sin((index * Math.PI) / 3) * 0.88,
          ]}
          rotation={[index * 0.2, index, index * 0.4]}
          geometry={PHASE_SHARD}
          material={index % 2 === 0 ? SEPULCHRE_MATERIALS.veilCue : SEPULCHRE_MATERIALS.boneCue}
        />
      ))}
    </CueRoot>
  )
})

export const SepulchreDefeatCue = forwardRef<Group>(function SepulchreDefeatCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, 0.25, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={DEFEAT_RING} material={SEPULCHRE_MATERIALS.ashCue} />
      {[0, 1, 2, 3].map((index) => (
        <mesh
          key={index}
          position={[
            Math.cos((index * Math.PI) / 2) * 0.55,
            0.15,
            Math.sin((index * Math.PI) / 2) * 0.55,
          ]}
          rotation={[0.3, index, 0.4]}
          geometry={DEFEAT_SHARD}
          material={SEPULCHRE_MATERIALS.veilCueSoft}
        />
      ))}
    </CueRoot>
  )
})
