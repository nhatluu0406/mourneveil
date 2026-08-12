import type { WorldObjectPlacement } from '../../worldObjectTypes'
import { getOssuaryMaterial } from '../materials'

export function SepulchreArenaSeal({ placement }: { readonly placement: WorldObjectPlacement }) {
  return (
    <group position={[...placement.position]} rotation={[...placement.rotation]} scale={placement.scale === undefined ? [1, 1, 1] : [...placement.scale]} userData={{ productionAssetId: 'world.landmark.veilbound-sepulchre-seal', instanceId: placement.instanceId }}>
      {[1.05, 1.9, 2.65].map((radius, index) => <mesh key={radius} rotation={[-Math.PI / 2, 0, index * 0.18]} position={[0, 0.085 + index * 0.002, 0]}><torusGeometry args={[radius, index === 1 ? 0.045 : 0.065, 6, 48]} /><primitive attach="material" object={getOssuaryMaterial(index === 1 ? 'veil' : 'bronze')} /></mesh>)}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => <mesh key={index} position={[Math.cos(index * Math.PI / 4) * 1.55, 0.09, Math.sin(index * Math.PI / 4) * 1.55]} rotation={[0, -index * Math.PI / 4, 0]}><boxGeometry args={[0.055, 0.025, 1.2]} /><primitive attach="material" object={getOssuaryMaterial(index % 3 === 0 ? 'veil' : 'verdigris')} /></mesh>)}
      <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 4, 0, 0]}><octahedronGeometry args={[0.22, 0]} /><primitive attach="material" object={getOssuaryMaterial('veil')} /></mesh>
    </group>
  )
}
