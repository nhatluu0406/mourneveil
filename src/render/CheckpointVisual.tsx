import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'

export function CheckpointVisual({ runtime }: { readonly runtime: GameRuntime }) {
  const materialRef = useRef<MeshStandardMaterial>(null)
  const crownRef = useRef<MeshStandardMaterial>(null)
  const flameRef = useRef<MeshStandardMaterial>(null)
  const checkpoint = runtime.snapshot().checkpoint

  useFrame(() => {
    const activated = runtime.snapshot().checkpoint.activated
    const material = materialRef.current
    const crown = crownRef.current
    const flame = flameRef.current
    if (material !== null) {
      material.color.set(
        activated ? MOURNEVEIL_PALETTE.checkpoint.active : MOURNEVEIL_PALETTE.checkpoint.inactive,
      )
      material.emissive.set(
        activated
          ? MOURNEVEIL_PALETTE.checkpoint.glowActive
          : MOURNEVEIL_PALETTE.checkpoint.glowInactive,
      )
      material.emissiveIntensity = activated ? 0.9 : 0.18
    }
    if (crown !== null) {
      crown.color.set(activated ? '#d7f3e6' : '#8fa296')
      crown.emissive.set(
        activated
          ? MOURNEVEIL_PALETTE.checkpoint.glowActive
          : MOURNEVEIL_PALETTE.checkpoint.glowInactive,
      )
      crown.emissiveIntensity = activated ? 1.15 : 0.14
    }
    if (flame !== null) {
      flame.emissiveIntensity = activated ? 1.4 : 0.2
      flame.visible = true
    }
  })

  return (
    <group position={[checkpoint.respawnPosition.x, 0, checkpoint.respawnPosition.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <ringGeometry args={[0.75, 1.2, 28]} />
        <meshStandardMaterial ref={materialRef} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.7, 0.35, 8]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.checkpoint.stone} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.38, 1.9, 0.28]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.checkpoint.stone} roughness={0.72} />
      </mesh>
      <mesh position={[0, 2.25, 0]} castShadow>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial ref={crownRef} roughness={0.35} metalness={0.18} />
      </mesh>
      <mesh position={[0, 2.65, 0]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial
          ref={flameRef}
          color="#dff7ea"
          emissive={MOURNEVEIL_PALETTE.checkpoint.glowActive}
          emissiveIntensity={0.2}
        />
      </mesh>
      <pointLight
        position={[0, 2.5, 0]}
        intensity={0.55}
        distance={6}
        color={MOURNEVEIL_PALETTE.checkpoint.active}
      />
    </group>
  )
}
