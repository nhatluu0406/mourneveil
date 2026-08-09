import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'

export function CheckpointVisual({ runtime }: { readonly runtime: GameRuntime }) {
  const materialRef = useRef<MeshStandardMaterial>(null)
  const checkpoint = runtime.snapshot().checkpoint

  useFrame(() => {
    const material = materialRef.current
    if (material === null) return
    material.color.set(runtime.snapshot().checkpoint.activated ? '#8fd0b5' : '#627a70')
    material.emissive.set(runtime.snapshot().checkpoint.activated ? '#315e50' : '#101814')
  })

  return (
    <group position={[checkpoint.respawnPosition.x, 0.04, checkpoint.respawnPosition.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[0.55, 0.78, 24]} />
        <meshStandardMaterial ref={materialRef} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.08, 0.14, 0.36, 10]} />
        <meshStandardMaterial color="#8ba095" roughness={0.72} />
      </mesh>
    </group>
  )
}
