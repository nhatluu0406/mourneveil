import { DoubleSide, type Group } from 'three'
import type { Ref } from 'react'

export function CombatContactVolumeCue({
  color,
  groupRef,
  opacity = 0.55,
}: {
  readonly color: string
  readonly groupRef?: Ref<Group | null>
  readonly opacity?: number
}) {
  return (
    <group ref={groupRef} visible={false} renderOrder={2}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <ringGeometry args={[0.62, 1, 40]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.55, 28]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.22}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  )
}
