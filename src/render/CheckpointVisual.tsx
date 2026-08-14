import { Clone, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MeshStandardMaterial } from 'three'
import { CHECKPOINT_SHRINE_ASSET } from '../content/assets/productionAssetReference'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'
import { checkpointShrinePresentation } from './checkpointShrinePresentation'

export function CheckpointVisual({ runtime }: { readonly runtime: GameRuntime }) {
  const ringRef = useRef<MeshStandardMaterial>(null)
  const flameRef = useRef<MeshStandardMaterial>(null)
  const checkpoint = runtime.snapshot().checkpoint
  const shrine = checkpointShrinePresentation(checkpoint)
  const { scene } = useGLTF(shrine.asset.runtimeUrl)

  useFrame(() => {
    const activated = runtime.snapshot().checkpoint.activated
    const ring = ringRef.current
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
    if (flame !== null) {
      flame.emissiveIntensity = activated ? 1.5 : 0.25
    }
  })

  return (
    <group
      position={shrine.position}
      rotation={shrine.rotationRadians}
      scale={shrine.scale}
      userData={{ productionAssetId: shrine.asset.id }}
    >
      <Clone
        object={scene}
        receiveShadow
        scale={0.52}
        position={[0, 0.1, 0]}
        inject={<meshStandardMaterial color="#60736d" roughness={0.66} metalness={0.12} />}
      />
      <mesh castShadow receiveShadow position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.4, 0.52, 0.3, 8]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.masonry} roughness={0.82} />
      </mesh>
      <mesh receiveShadow position={[0, 0.76, 0.22]}>
        <boxGeometry args={[0.72, 1.08, 0.12]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.recess} roughness={0.92} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.76, 0.12]}>
          <cylinderGeometry args={[0.035, 0.055, 1.02, 6]} />
          <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.bronze} roughness={0.44} metalness={0.62} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.036, 0]} receiveShadow>
        <ringGeometry args={[0.64, 0.7, 32]} />
        <meshStandardMaterial ref={ringRef} roughness={0.46} metalness={0.28} transparent opacity={0.62} />
      </mesh>
      <mesh position={[0, 1.18, 0.08]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial
          ref={flameRef}
          color="#e8fff4"
          emissive={MOURNEVEIL_PALETTE.checkpoint.glowActive}
          emissiveIntensity={0.25}
        />
      </mesh>
      <pointLight
        position={[0, 1.15, 0]}
        intensity={4.2}
        distance={6.5}
        decay={2}
        color={MOURNEVEIL_PALETTE.checkpoint.active}
      />
    </group>
  )
}

useGLTF.preload(CHECKPOINT_SHRINE_ASSET.runtimeUrl)
