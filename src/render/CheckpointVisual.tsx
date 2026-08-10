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
      <Clone object={scene} castShadow receiveShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <ringGeometry args={[0.85, 1.35, 32]} />
        <meshStandardMaterial ref={ringRef} roughness={0.55} />
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

useGLTF.preload(CHECKPOINT_SHRINE_ASSET.runtimeUrl)
