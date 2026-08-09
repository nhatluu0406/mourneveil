import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'

export function CheckpointVisual({ runtime }: { readonly runtime: GameRuntime }) {
  const materialRef = useRef<MeshStandardMaterial>(null)
  const crownRef = useRef<MeshStandardMaterial>(null)
  const checkpoint = runtime.snapshot().checkpoint

  useFrame(() => {
    const activated = runtime.snapshot().checkpoint.activated
    const material = materialRef.current
    const crown = crownRef.current
    if (material !== null) {
      material.color.set(activated ? '#9fe0c4' : '#6a8076')
      material.emissive.set(activated ? '#3f7a64' : '#152018')
      material.emissiveIntensity = activated ? 0.85 : 0.15
    }
    if (crown !== null) {
      crown.color.set(activated ? '#d7f3e6' : '#8fa296')
      crown.emissive.set(activated ? '#4d8f74' : '#101814')
      crown.emissiveIntensity = activated ? 1.1 : 0.12
    }
  })

  return (
    <group position={[checkpoint.respawnPosition.x, 0, checkpoint.respawnPosition.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <ringGeometry args={[0.7, 1.05, 28]} />
        <meshStandardMaterial ref={materialRef} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 2.1, 12]} />
        <meshStandardMaterial color="#7f9488" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[0.28, 14, 12]} />
        <meshStandardMaterial ref={crownRef} roughness={0.35} metalness={0.15} />
      </mesh>
    </group>
  )
}
