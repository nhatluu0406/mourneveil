import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, MeshStandardMaterial } from 'three'
import type { PlayerRuntime } from '../game/character/playerRuntime'

export const TRAINING_TARGET_VISUAL_RADIUS = 0.34
export const TRAINING_TARGET_VISUAL_HEIGHT = 1.2

const HIT_FLASH_SECONDS = 0.12
const HIT_RECOIL_SECONDS = 0.18

export function TrainingTargetVisual({ runtime }: { runtime: PlayerRuntime }) {
  const groupRef = useRef<Group>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)
  const lastHitRevisionRef = useRef(0)
  const flashRemainingRef = useRef(0)
  const recoilRemainingRef = useRef(0)

  useFrame((_, deltaSeconds) => {
    const group = groupRef.current
    const material = materialRef.current
    if (group === null || material === null) {
      return
    }

    const target = runtime.snapshot().trainingTarget
    if (target.hitRevision !== lastHitRevisionRef.current) {
      lastHitRevisionRef.current = target.hitRevision
      if (target.hitCount > 0) {
        flashRemainingRef.current = HIT_FLASH_SECONDS
        recoilRemainingRef.current = HIT_RECOIL_SECONDS
      }
    }

    flashRemainingRef.current = Math.max(0, flashRemainingRef.current - deltaSeconds)
    recoilRemainingRef.current = Math.max(0, recoilRemainingRef.current - deltaSeconds)

    const recoil =
      recoilRemainingRef.current > 0
        ? Math.sin((recoilRemainingRef.current / HIT_RECOIL_SECONDS) * Math.PI) * 0.08
        : 0
    const baseScaleY = target.health.alive ? 1 : 0.35
    group.scale.set(1 + recoil * 0.35, baseScaleY - recoil * 0.5, 1 + recoil * 0.35)

    if (flashRemainingRef.current > 0) {
      material.color.set('#f3e6c4')
      return
    }

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
    </group>
  )
}
