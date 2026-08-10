import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'

export function CheckpointVisual({ runtime }: { readonly runtime: GameRuntime }) {
  const ringRef = useRef<MeshStandardMaterial>(null)
  const crownRef = useRef<MeshStandardMaterial>(null)
  const flameRef = useRef<MeshStandardMaterial>(null)
  const checkpoint = runtime.snapshot().checkpoint

  useFrame(() => {
    const activated = runtime.snapshot().checkpoint.activated
    const ring = ringRef.current
    const crown = crownRef.current
    const flame = flameRef.current
    if (ring !== null) {
      ring.color.set(
        activated ? MOURNEVEIL_PALETTE.checkpoint.active : MOURNEVEIL_PALETTE.checkpoint.inactive,
      )
      ring.emissive.set(
        activated
          ? MOURNEVEIL_PALETTE.checkpoint.glowActive
          : MOURNEVEIL_PALETTE.checkpoint.glowInactive,
      )
      ring.emissiveIntensity = activated ? 0.95 : 0.18
    }
    if (crown !== null) {
      crown.emissiveIntensity = activated ? 1.1 : 0.15
    }
    if (flame !== null) {
      flame.emissiveIntensity = activated ? 1.5 : 0.25
    }
  })

  return (
    <group position={[checkpoint.respawnPosition.x, 0, checkpoint.respawnPosition.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <ringGeometry args={[0.85, 1.35, 32]} />
        <meshStandardMaterial ref={ringRef} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.85, 0.22, 8]} />
        <meshStandardMaterial color="#5f6d66" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.32, 2.1, 0.22]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.checkpoint.stone} roughness={0.82} />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[0.55, 0.28, 0.28]} />
        <meshStandardMaterial
          ref={crownRef}
          color="#d7f3e6"
          emissive={MOURNEVEIL_PALETTE.checkpoint.glowActive}
          roughness={0.4}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0, 2.7, 0]}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial
          ref={flameRef}
          color="#e8fff4"
          emissive={MOURNEVEIL_PALETTE.checkpoint.glowActive}
          emissiveIntensity={0.25}
        />
      </mesh>
      <pointLight
        position={[0, 2.4, 0]}
        intensity={0.85}
        distance={7}
        color={MOURNEVEIL_PALETTE.checkpoint.active}
      />
    </group>
  )
}
