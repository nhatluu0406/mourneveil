import { forwardRef, type ReactNode } from 'react'
import type { Group } from 'three'
import { SEPULCHRE_COLORS } from './SepulchreMaterials'

const CueRoot = forwardRef<Group, {
  readonly children: ReactNode
  readonly position: readonly [number, number, number]
  readonly rotateFloor?: boolean
}>(function CueRoot({ children, position, rotateFloor = false }, ref) {
  return <group ref={ref} visible={false} position={[...position]} rotation={rotateFloor ? [-Math.PI / 2, 0, 0] : undefined}>{children}</group>
})

export const SepulchreSlashCue = forwardRef<Group>(function SepulchreSlashCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, -0.68, -0.18]} rotateFloor>
      <mesh rotation={[0, 0, 0.3]}><torusGeometry args={[1.15, 0.065, 6, 36, Math.PI * 1.15]} /><meshBasicMaterial color={SEPULCHRE_COLORS.veil} transparent opacity={0.82} depthWrite={false} /></mesh>
      {[0, 1, 2].map((index) => <mesh key={index} position={[0.45 + index * 0.28, -0.25 + index * 0.12, 0]} rotation={[0, 0, -0.7]}><coneGeometry args={[0.07, 0.38, 4]} /><meshBasicMaterial color={SEPULCHRE_COLORS.veil} transparent opacity={0.75} /></mesh>)}
    </CueRoot>
  )
})

export const SepulchreCrushCue = forwardRef<Group>(function SepulchreCrushCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, -0.68, -0.9]} rotateFloor>
      <mesh rotation={[0, 0, Math.PI / 4]}><ringGeometry args={[0.36, 0.48, 4]} /><meshBasicMaterial color={SEPULCHRE_COLORS.funeralFire} transparent opacity={0.9} depthWrite={false} side={2} /></mesh>
      <mesh><ringGeometry args={[0.62, 0.69, 20]} /><meshBasicMaterial color={SEPULCHRE_COLORS.bronze} transparent opacity={0.64} depthWrite={false} side={2} /></mesh>
    </CueRoot>
  )
})

export const SepulchreLungeCue = forwardRef<Group>(function SepulchreLungeCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, -0.68, -1.25]}>
      <mesh><boxGeometry args={[0.18, 0.035, 2.5]} /><meshBasicMaterial color={SEPULCHRE_COLORS.veil} transparent opacity={0.76} depthWrite={false} /></mesh>
      <mesh position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.26, 0.5, 3]} /><meshBasicMaterial color={SEPULCHRE_COLORS.veil} transparent opacity={0.82} /></mesh>
    </CueRoot>
  )
})

export const SepulchreSlamCue = forwardRef<Group>(function SepulchreSlamCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, -0.68, 0]} rotateFloor>
      {[0.72, 1.18, 1.66].map((radius, index) => <mesh key={radius}><ringGeometry args={[radius, radius + 0.065, 40]} /><meshBasicMaterial color={index === 1 ? SEPULCHRE_COLORS.funeralFire : SEPULCHRE_COLORS.veil} transparent opacity={0.78 - index * 0.08} depthWrite={false} side={2} /></mesh>)}
      {[0, 1, 2, 3, 4, 5].map((index) => <mesh key={index} rotation={[0, 0, index * Math.PI / 3]}><boxGeometry args={[0.055, 1.65, 0.02]} /><meshBasicMaterial color={SEPULCHRE_COLORS.veil} transparent opacity={0.52} /></mesh>)}
    </CueRoot>
  )
})

export const SepulchrePhaseCue = forwardRef<Group>(function SepulchrePhaseCue(_, ref) {
  return <CueRoot ref={ref} position={[0, 0.3, 0]}>{[0, 1, 2, 3, 4, 5].map((index) => <mesh key={index} position={[Math.cos(index * Math.PI / 3) * 0.88, 0.2 + (index % 2) * 0.32, Math.sin(index * Math.PI / 3) * 0.88]} rotation={[index * 0.2, index, index * 0.4]}><tetrahedronGeometry args={[0.11, 0]} /><meshBasicMaterial color={index % 2 === 0 ? SEPULCHRE_COLORS.veil : SEPULCHRE_COLORS.bone} transparent opacity={0.72} /></mesh>)}</CueRoot>
})

export const SepulchreDefeatCue = forwardRef<Group>(function SepulchreDefeatCue(_, ref) {
  return (
    <CueRoot ref={ref} position={[0, 0.25, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.75, 0.82, 40]} /><meshBasicMaterial color={SEPULCHRE_COLORS.ash} transparent opacity={0.5} depthWrite={false} side={2} /></mesh>
      {[0, 1, 2, 3].map((index) => <mesh key={index} position={[Math.cos(index * Math.PI / 2) * 0.55, 0.15, Math.sin(index * Math.PI / 2) * 0.55]} rotation={[0.3, index, 0.4]}><octahedronGeometry args={[0.13, 0]} /><meshBasicMaterial color={SEPULCHRE_COLORS.veil} transparent opacity={0.48} /></mesh>)}
    </CueRoot>
  )
})
