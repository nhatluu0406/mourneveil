import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, MeshStandardMaterial } from 'three'
import type { PlayerRuntime } from '../game/character/playerRuntime'

export const TRAINING_TARGET_VISUAL_RADIUS = 0.34
export const TRAINING_TARGET_VISUAL_HEIGHT = 1.2

export function TrainingTargetVisual({ runtime }: { runtime: PlayerRuntime }) {
  const groupRef = useRef<Group>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)

  useFrame(() => {
    const group = groupRef.current
    const material = materialRef.current
    if (group === null || material === null) {
      return
    }

    const target = runtime.snapshot().trainingTarget
    group.scale.y = target.health.alive ? 1 : 0.35
    material.color.set(
      target.health.alive
        ? target.health.current < target.health.maximum
          ? '#cf765e'
          : '#779b80'
        : '#403b39',
    )
  })

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry
          args={[
            TRAINING_TARGET_VISUAL_RADIUS,
            TRAINING_TARGET_VISUAL_RADIUS,
            TRAINING_TARGET_VISUAL_HEIGHT,
            12,
          ]}
        />
        <meshStandardMaterial ref={materialRef} roughness={0.8} />
      </mesh>
      <mesh position={[0, TRAINING_TARGET_VISUAL_HEIGHT * 0.32, -0.34]}>
        <boxGeometry args={[0.18, 0.12, 0.08]} />
        <meshStandardMaterial color="#d6decf" roughness={0.7} />
      </mesh>
    </group>
  )
}
