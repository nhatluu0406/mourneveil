import type { Ref } from 'react'
import type { MeshStandardMaterial } from 'three'
import { createOathbladeGeometry } from '../productionGeometry'

const OATHBLADE_GEOMETRY = createOathbladeGeometry()

interface OathbladeVisualProps {
  readonly materialRef?: Ref<MeshStandardMaterial>
  readonly bladeColor?: string
}

/** Reusable Warden weapon visual — presentation only. */
export function OathbladeVisual({
  materialRef,
  bladeColor = '#aeb5ad',
}: OathbladeVisualProps) {
  return (
    <group userData={{ productionAssetId: 'weapon.player.oathblade' }}>
      <mesh castShadow>
        <primitive attach="geometry" object={OATHBLADE_GEOMETRY} />
        <meshStandardMaterial
          ref={materialRef}
          color={bladeColor}
          roughness={0.24}
          metalness={0.78}
        />
      </mesh>

      {/* Veil channel: visual identity only; gameplay reach remains simulation-owned. */}
      <mesh position={[0, -0.012, -0.31]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.014, 0.34, 0.009]} />
        <meshStandardMaterial
          color="#89d8d9"
          emissive="#2b8c8c"
          emissiveIntensity={0.75}
          roughness={0.32}
          metalness={0.24}
        />
      </mesh>

      <group position={[0, 0, 0.065]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.036, 0.06, 0.3, 6]} />
          <meshStandardMaterial color="#76533a" roughness={0.38} metalness={0.7} />
        </mesh>
        <mesh castShadow position={[-0.14, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.055, 0]} />
          <meshStandardMaterial color="#91714b" roughness={0.36} metalness={0.74} />
        </mesh>
        <mesh castShadow position={[0.14, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.055, 0]} />
          <meshStandardMaterial color="#91714b" roughness={0.36} metalness={0.74} />
        </mesh>
      </group>

      <mesh castShadow position={[0, 0, 0.205]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.036, 0.046, 0.25, 8]} />
        <meshStandardMaterial color="#1a1715" roughness={0.94} />
      </mesh>
      <mesh castShadow position={[0, 0, 0.34]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial
          color="#8dcac8"
          emissive="#266d70"
          emissiveIntensity={0.42}
          roughness={0.34}
          metalness={0.38}
        />
      </mesh>
    </group>
  )
}
