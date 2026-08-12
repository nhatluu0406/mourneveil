import { useLayoutEffect, useRef } from 'react'
import { Object3D, Vector2, type InstancedMesh } from 'three'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'
import { createTaperedPrismGeometry } from './productionGeometry'

const MARKER_STEM = createTaperedPrismGeometry({
  bottomWidth: 0.32,
  topWidth: 0.21,
  height: 0.72,
  depth: 0.18,
})

const RUBBLE = Object.freeze([
  [-7.55, 0.12, -1.6, 0.8, 0.3],
  [-7.25, 0.09, -1.72, 0.55, -0.5],
  [-4.15, 0.1, 1.65, 0.62, 0.4],
  [-4.42, 0.08, 1.76, 0.44, -0.2],
  [-9.15, 0.1, 0.35, 0.6, 0.1],
  [-9.45, 0.08, 0.18, 0.42, 0.7],
  [-7.55, 0.08, 1.75, 0.48, -0.6],
  [-4.25, 0.07, -1.72, 0.4, 0.2],
] as const)

const LATHE_PROFILE = [
  new Vector2(0.25, 0),
  new Vector2(0.29, 0.1),
  new Vector2(0.21, 0.2),
  new Vector2(0.18, 0.72),
  new Vector2(0.1, 0.92),
  new Vector2(0, 1.05),
]

function InstancedRubble() {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (mesh === null) return
    const transform = new Object3D()
    RUBBLE.forEach(([x, y, z, scale, rotation], index) => {
      transform.position.set(x, y, z)
      transform.rotation.set(rotation * 0.3, rotation, rotation * 0.18)
      transform.scale.set(scale, scale * 0.55, scale * 0.72)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, RUBBLE.length]} receiveShadow>
      <dodecahedronGeometry args={[0.28, 0]} />
      <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.masonry} roughness={0.96} />
    </instancedMesh>
  )
}

function FuneraryMarker({ position, rotation = 0 }: { readonly position: [number, number, number]; readonly rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.36, 0]}>
        <primitive attach="geometry" object={MARKER_STEM} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.masonry} roughness={0.86} />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.045, 6, 20, Math.PI * 1.55]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.bone} roughness={0.72} />
      </mesh>
    </group>
  )
}

/** Non-blocking hero dressing over the authoritative level floor/proxies. */
export function OssuaryHeroDressing() {
  return (
    <group userData={{ productionAssetId: 'world.kit.ossuary-hero' }}>
      {/* Broken radial paving around the refuge. */}
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <mesh
          key={index}
          receiveShadow
          position={[-5.5, 0.035 + index * 0.0005, 0]}
          rotation={[-Math.PI / 2, 0, index * (Math.PI / 3) + 0.08]}
        >
          <ringGeometry args={[1.45, 2.28, 8, 1, 0.08, 0.78]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? '#28312e' : '#1e2825'}
            roughness={0.94}
          />
        </mesh>
      ))}

      {/* Boundary markers make the refuge feel authored without adding fake solids. */}
      <FuneraryMarker position={[-7.72, 0, -1.72]} rotation={0.18} />
      <FuneraryMarker position={[-7.72, 0, 1.72]} rotation={-0.12} />
      <FuneraryMarker position={[-4.08, 0, -1.72]} rotation={-0.18} />
      <FuneraryMarker position={[-4.08, 0, 1.72]} rotation={0.12} />

      {/* Low ossuary bowls and amber practicals. */}
      {[
        [-7.2, -1.45],
        [-4.25, 1.35],
      ].map(([x, z], index) => (
        <group key={`${x}:${z}`} position={[x, 0, z]}>
          <mesh castShadow position={[0, 0.18, 0]}>
            <latheGeometry args={[LATHE_PROFILE, 12]} />
            <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.bronze} roughness={0.48} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.92, 0]}>
            <octahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial color="#ffd39b" emissive="#b85a22" emissiveIntensity={1.25} roughness={0.25} />
          </mesh>
          {index === 0 ? <pointLight position={[0, 0.9, 0]} intensity={0.42} distance={4.2} color="#d88946" /> : null}
        </group>
      ))}

      {/* Inlaid funerary metalwork, safely flush with the floor. */}
      <mesh position={[-6.5, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.025, 5, 32, Math.PI * 1.65]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.verdigris} roughness={0.46} metalness={0.58} />
      </mesh>
      <InstancedRubble />
    </group>
  )
}
