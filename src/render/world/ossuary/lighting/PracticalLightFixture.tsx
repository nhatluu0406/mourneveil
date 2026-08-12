import { AdditiveBlending, BackSide } from 'three'
import { getOssuaryMaterial } from '../materials'
import type { WorldObjectPlacement } from '../../worldObjectTypes'

const WARM = '#f1a15f'
const VEIL = '#8fe9df'

function Glow({ color, scale = 1 }: { readonly color: string; readonly scale?: number }) {
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[0.18, 10, 8]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.18}
        side={BackSide}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  )
}

function Flame({ veil = false }: { readonly veil?: boolean }) {
  const color = veil ? VEIL : WARM
  return (
    <group>
      <mesh scale={[0.72, 1.25, 0.72]}>
        <octahedronGeometry args={[0.13, 1]} />
        <meshStandardMaterial color="#fff2d6" emissive={color} emissiveIntensity={2.7} roughness={0.2} />
      </mesh>
      <Glow color={color} scale={1.55} />
    </group>
  )
}

function WallSconce({ actualLight }: { readonly actualLight: boolean }) {
  return (
    <group>
      <mesh material={getOssuaryMaterial('iron')} castShadow position={[0, 0, -0.1]}>
        <boxGeometry args={[0.26, 0.42, 0.1]} />
      </mesh>
      <mesh material={getOssuaryMaterial('bronze')} castShadow position={[0, -0.08, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.055, 0.52, 7]} />
      </mesh>
      <mesh material={getOssuaryMaterial('iron')} castShadow position={[0, 0.08, 0.46]}>
        <cylinderGeometry args={[0.22, 0.13, 0.14, 9]} />
      </mesh>
      <group position={[0, 0.32, 0.46]}><Flame /></group>
      {actualLight ? <pointLight position={[0, 0.42, 0.58]} intensity={6.5} distance={8.2} decay={2} color={WARM} /> : null}
    </group>
  )
}

function Brazier({ actualLight }: { readonly actualLight: boolean }) {
  return (
    <group>
      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => (
        <mesh key={angle} material={getOssuaryMaterial('iron')} castShadow position={[Math.sin(angle) * 0.28, 0.35, Math.cos(angle) * 0.28]} rotation={[0.08 * Math.cos(angle), 0, -0.08 * Math.sin(angle)]}>
          <cylinderGeometry args={[0.035, 0.06, 0.72, 6]} />
        </mesh>
      ))}
      <mesh material={getOssuaryMaterial('bronze')} castShadow position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.46, 0.28, 0.22, 12, 1, true]} />
      </mesh>
      <mesh material={getOssuaryMaterial('iron')} castShadow position={[0, 0.68, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.045, 6, 16]} />
      </mesh>
      <group position={[0, 0.98, 0]} scale={1.32}><Flame /></group>
      {actualLight ? <pointLight position={[0, 1.3, 0]} intensity={8.5} distance={10.5} decay={2} color={WARM} /> : null}
    </group>
  )
}

function VeilLamp({ actualLight }: { readonly actualLight: boolean }) {
  return (
    <group>
      <mesh material={getOssuaryMaterial('verdigris')} castShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.08, 0.13, 1.4, 7]} />
      </mesh>
      {[0, Math.PI / 2].map((angle) => (
        <mesh key={angle} material={getOssuaryMaterial('iron')} castShadow position={[0, 1.38, 0]} rotation={[0, angle, 0]}>
          <torusGeometry args={[0.3, 0.032, 6, 16]} />
        </mesh>
      ))}
      <group position={[0, 1.38, 0]} scale={1.18}><Flame veil /></group>
      {actualLight ? <pointLight position={[0, 1.55, 0]} intensity={5.5} distance={8.5} decay={2} color={VEIL} /> : null}
    </group>
  )
}

function CandleCluster() {
  return (
    <group>
      {[
        [-0.16, 0.19, 0.02, 0.38],
        [0, 0.27, -0.05, 0.54],
        [0.15, 0.15, 0.05, 0.3],
      ].map(([x, y, z, height], index) => (
        <group key={index} position={[x, 0, z]}>
          <mesh material={getOssuaryMaterial('bone')} position={[0, y, 0]}>
            <cylinderGeometry args={[0.035, 0.045, height, 7]} />
          </mesh>
          <group position={[0, height + 0.02, 0]} scale={0.34}><Flame /></group>
        </group>
      ))}
    </group>
  )
}

/** Presentation-only fixture. `actual-light` selects sparse photometric sources; all fixtures remain visual projections. */
export function PracticalLightFixture({ placement }: { readonly placement: WorldObjectPlacement }) {
  const actualLight = placement.variant === 'actual-light'
  let fixture = null
  switch (placement.objectId) {
    case 'ossuary.light.wall-sconce': fixture = <WallSconce actualLight={actualLight} />; break
    case 'ossuary.light.brazier': fixture = <Brazier actualLight={actualLight} />; break
    case 'ossuary.light.veil-lamp': fixture = <VeilLamp actualLight={actualLight} />; break
    case 'ossuary.light.candle-cluster': fixture = <CandleCluster />; break
  }
  return (
    <group position={[...placement.position]} rotation={[...placement.rotation]} scale={placement.scale === undefined ? [1, 1, 1] : [...placement.scale]} userData={{ practicalLightFixture: placement.objectId, actualLight, instanceId: placement.instanceId }}>
      {fixture}
    </group>
  )
}
