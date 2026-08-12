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
        castShadow
        receiveShadow
        scale={0.82}
        position={[0, 0.18, 0]}
        inject={<meshStandardMaterial color="#60736d" roughness={0.66} metalness={0.12} />}
      />
      {/* Project-authored ossuary mantle remains inside the canonical shrine proxy. */}
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.48, 0.58, 0.34, 10]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.masonry} roughness={0.82} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
        <group key={angle} rotation={[0, angle, 0]}>
          <mesh castShadow position={[0, 1.42, -0.31]} scale={[0.5, 1.2, 0.5]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.bone} roughness={0.74} />
          </mesh>
          <mesh castShadow position={[0, 0.82, -0.34]}>
            <cylinderGeometry args={[0.055, 0.09, 1.05, 6]} />
            <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.bronze} roughness={0.45} metalness={0.62} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 1.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.055, 7, 32, Math.PI * 1.75]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.verdigris} roughness={0.4} metalness={0.65} />
      </mesh>
      {/* Compact reliquary crown stays inside the existing shrine proxy footprint. */}
      {[0, Math.PI / 2].map((angle) => (
        <group key={`crown:${angle}`} rotation={[0, angle, 0]}>
          <mesh castShadow position={[0, 2.18, 0]}>
            <torusGeometry args={[0.31, 0.045, 6, 20, Math.PI]} />
            <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.bone} roughness={0.7} />
          </mesh>
          {[-0.31, 0.31].map((x) => (
            <mesh key={x} castShadow position={[x, 1.9, 0]}>
              <cylinderGeometry args={[0.035, 0.05, 0.56, 6]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.bronze} roughness={0.44} metalness={0.62} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.036, 0]} receiveShadow>
        <ringGeometry args={[1.02, 1.09, 48]} />
        <meshStandardMaterial ref={ringRef} roughness={0.46} metalness={0.28} transparent opacity={0.62} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 6]} position={[0, 0.039, 0]} receiveShadow>
        <ringGeometry args={[0.67, 0.705, 40, 1, 0.2, Math.PI * 1.65]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.verdigris} emissive={MOURNEVEIL_PALETTE.checkpoint.glowInactive} emissiveIntensity={0.18} roughness={0.42} metalness={0.48} transparent opacity={0.58} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
        <mesh key={`rune:${angle}`} position={[Math.sin(angle) * 0.88, 0.042, Math.cos(angle) * 0.88]} rotation={[-Math.PI / 2, angle, 0]}>
          <boxGeometry args={[0.035, 0.2, 0.012]} />
          <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.bronze} emissive={MOURNEVEIL_PALETTE.checkpoint.glowInactive} emissiveIntensity={0.12} roughness={0.4} metalness={0.62} />
        </mesh>
      ))}
      <mesh position={[0, 2.48, 0]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial
          ref={flameRef}
          color="#e8fff4"
          emissive={MOURNEVEIL_PALETTE.checkpoint.glowActive}
          emissiveIntensity={0.25}
        />
      </mesh>
      <pointLight
        position={[0, 2.2, 0]}
        intensity={1.7}
        distance={7}
        decay={2}
        color={MOURNEVEIL_PALETTE.checkpoint.active}
      />
    </group>
  )
}

useGLTF.preload(CHECKPOINT_SHRINE_ASSET.runtimeUrl)
