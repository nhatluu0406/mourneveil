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
  bladeColor = '#bfc4ba',
}: OathbladeVisualProps) {
  return (
    <group userData={{ productionAssetId: 'weapon.player.oathblade' }}>
      <mesh castShadow>
        <primitive attach="geometry" object={OATHBLADE_GEOMETRY} />
        <meshStandardMaterial
          ref={materialRef}
          color={bladeColor}
          roughness={0.28}
          metalness={0.72}
        />
      </mesh>
      <mesh castShadow position={[0, 0, 0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.055, 0.28, 6]} />
        <meshStandardMaterial color="#806642" roughness={0.4} metalness={0.68} />
      </mesh>
      <mesh castShadow position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.24, 7]} />
        <meshStandardMaterial color="#211d1a" roughness={0.92} />
      </mesh>
    </group>
  )
}
