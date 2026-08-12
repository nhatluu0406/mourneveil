import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import {
  BoxGeometry,
  type BufferGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  TorusGeometry,
  type Group,
  type InstancedMesh,
} from 'three'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'
import {
  OSSUARY_BUTTRESSES,
  OSSUARY_FLOOR_INLAYS,
  OSSUARY_FLOOR_SLABS,
  OSSUARY_RUBBLE,
  OSSUARY_SARCOPHAGI,
  OSSUARY_TOMB_NICHES,
  OSSUARY_WALL_BAYS,
  type OssuaryPlacement,
} from './ossuaryEnvironmentLayout'
import { createProfilePrismGeometry, createTaperedPrismGeometry } from './productionGeometry'

const FLOOR_GEOMETRY = createProfilePrismGeometry(
  [[-0.52, -0.46], [0.38, -0.5], [0.52, -0.3], [0.48, 0.45], [0.12, 0.5], [-0.46, 0.4]],
  0.035,
)
const INLAY_GEOMETRY = new BoxGeometry(0.55, 0.025, 0.055)
const WALL_PANEL_GEOMETRY = new BoxGeometry(0.16, 1.25, 1.2)
const NICHE_GEOMETRY = new BoxGeometry(0.06, 0.74, 0.62)
const NICHE_ARCH_GEOMETRY = new TorusGeometry(0.29, 0.034, 5, 18, Math.PI)
const BUTTRESS_GEOMETRY = createTaperedPrismGeometry({
  bottomWidth: 0.42,
  topWidth: 0.22,
  height: 2.04,
  depth: 0.4,
})
const SARCOPHAGUS_GEOMETRY = createTaperedPrismGeometry({
  bottomWidth: 0.72,
  topWidth: 0.62,
  height: 0.42,
  depth: 1.25,
})
const SARCOPHAGUS_LID_GEOMETRY = createTaperedPrismGeometry({
  bottomWidth: 0.7,
  topWidth: 0.46,
  height: 0.2,
  depth: 1.2,
})
const RUBBLE_GEOMETRY = new DodecahedronGeometry(0.34, 0)
const ARCH_GEOMETRY = new TorusGeometry(0.96, 0.11, 6, 24, Math.PI)
const ARCH_RIB_GEOMETRY = createTaperedPrismGeometry({
  bottomWidth: 0.24,
  topWidth: 0.16,
  height: 1.7,
  depth: 0.22,
})
const MONOLITH_GEOMETRY = createTaperedPrismGeometry({
  bottomWidth: 0.88,
  topWidth: 0.5,
  height: 2.9,
  depth: 0.78,
})
const MONOLITH_CAP_GEOMETRY = new OctahedronGeometry(0.42, 0)
const RELIQUARY_PLINTH_GEOMETRY = createTaperedPrismGeometry({
  bottomWidth: 1.12,
  topWidth: 0.78,
  height: 1.56,
  depth: 1.12,
})
const WISP_GEOMETRY = new OctahedronGeometry(0.065, 0)
const MARKER_GEOMETRY = createTaperedPrismGeometry({ bottomWidth: 0.28, topWidth: 0.17, height: 0.7, depth: 0.16 })
const MARKER_CAP_GEOMETRY = new OctahedronGeometry(0.15, 0)
const CANDLE_GEOMETRY = new CylinderGeometry(0.025, 0.035, 0.26, 6)
const FLAME_GEOMETRY = new OctahedronGeometry(0.045, 0)
const BANNER_GEOMETRY = new BoxGeometry(0.5, 0.84, 0.025)
const ROOT_GEOMETRY = new TorusGeometry(0.46, 0.035, 5, 16, Math.PI * 1.35)

const MATERIALS = Object.freeze({
  floor: new MeshStandardMaterial({
    color: MOURNEVEIL_PALETTE.environment.floorSlab,
    roughness: 0.93,
    metalness: 0.02,
  }),
  inlay: new MeshStandardMaterial({
    color: MOURNEVEIL_PALETTE.environment.verdigris,
    roughness: 0.45,
    metalness: 0.62,
  }),
  stone: new MeshStandardMaterial({
    color: MOURNEVEIL_PALETTE.environment.masonry,
    roughness: 0.88,
    metalness: 0.02,
  }),
  recess: new MeshStandardMaterial({
    color: MOURNEVEIL_PALETTE.environment.recess,
    roughness: 0.98,
    metalness: 0,
  }),
  bone: new MeshStandardMaterial({
    color: MOURNEVEIL_PALETTE.environment.bone,
    roughness: 0.76,
    metalness: 0.01,
  }),
  iron: new MeshStandardMaterial({
    color: MOURNEVEIL_PALETTE.environment.iron,
    roughness: 0.52,
    metalness: 0.76,
  }),
  bronze: new MeshStandardMaterial({
    color: MOURNEVEIL_PALETTE.environment.bronze,
    roughness: 0.48,
    metalness: 0.62,
  }),
  cloth: new MeshStandardMaterial({
    color: MOURNEVEIL_PALETTE.environment.cloth,
    roughness: 0.92,
    metalness: 0,
  }),
  ember: new MeshStandardMaterial({
    color: '#ffd1a0',
    emissive: '#a64d21',
    emissiveIntensity: 1.4,
    roughness: 0.3,
  }),
  veil: new MeshStandardMaterial({
    color: '#b8f8ee',
    emissive: MOURNEVEIL_PALETTE.checkpoint.glowActive,
    emissiveIntensity: 1.35,
    roughness: 0.28,
  }),
})

const CORRIDOR_ARCHES: readonly OssuaryPlacement[] = Object.freeze([
  Object.freeze({ id: 'arch.corridor.0', area: 'corridor', position: [-7.78, 1.55, 1.05], rotation: [0, -0.62, 0], scale: [1, 1, 1] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'arch.corridor.1', area: 'corridor', position: [-8.7, 1.55, 2.45], rotation: [0, -0.62, 0], scale: [1, 1, 1] } satisfies OssuaryPlacement),
])

const CORRIDOR_RIBS: readonly OssuaryPlacement[] = Object.freeze(
  CORRIDOR_ARCHES.flatMap((arch, index) =>
    [-1, 1].map((side) => {
      const localX = side * 0.95
      const angle = arch.rotation[1]
      return Object.freeze({
        id: `arch-rib.${index}.${side}`,
        area: 'corridor' as const,
        position: Object.freeze([
          arch.position[0] + Math.cos(angle) * localX,
          0.85,
          arch.position[2] - Math.sin(angle) * localX,
        ] as const),
        rotation: arch.rotation,
        scale: Object.freeze([1, 1, 1] as const),
      })
    }),
  ),
)

const SARCOPHAGUS_LIDS: readonly OssuaryPlacement[] = Object.freeze(
  OSSUARY_SARCOPHAGI.map((entry) =>
    Object.freeze({
      ...entry,
      position: Object.freeze([
        entry.position[0],
        entry.position[1] + 0.28,
        entry.position[2],
      ] as const),
    }),
  ),
)

const WISP_PLACEMENTS: readonly OssuaryPlacement[] = Object.freeze([
  Object.freeze({ id: 'wisp.0', area: 'refuge', position: [-4.55, 1.3, 1.2], rotation: [0, 0, 0], scale: [1, 1.8, 1] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'wisp.1', area: 'corridor', position: [-7.75, 1.5, 2.7], rotation: [0, 0, 0], scale: [0.8, 1.5, 0.8] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'wisp.2', area: 'first-combat', position: [-9.0, 1.1, 4.35], rotation: [0, 0, 0], scale: [0.75, 1.4, 0.75] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'wisp.3', area: 'first-combat', position: [-11.65, 1.45, 2.65], rotation: [0, 0, 0], scale: [0.65, 1.25, 0.65] } satisfies OssuaryPlacement),
])

const MARKER_PLACEMENTS: readonly OssuaryPlacement[] = Object.freeze([
  Object.freeze({ id: 'marker.refuge.0', area: 'refuge', position: [-7.6, 0.36, -1.72], rotation: [0, 0.12, 0], scale: [1, 1, 1] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'marker.refuge.1', area: 'refuge', position: [-4.18, 0.36, 1.72], rotation: [0, -0.12, 0], scale: [1, 1, 1] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'marker.corridor.0', area: 'corridor', position: [-7.25, 0.36, 2.92], rotation: [0, -0.3, 0], scale: [0.86, 0.9, 0.86] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'marker.combat.0', area: 'first-combat', position: [-11.62, 0.36, 3.9], rotation: [0, 0.2, 0], scale: [1, 1, 1] } satisfies OssuaryPlacement),
])

const MARKER_CAPS: readonly OssuaryPlacement[] = Object.freeze(
  MARKER_PLACEMENTS.map((entry) => Object.freeze({ ...entry, position: [entry.position[0], 0.83, entry.position[2]] } satisfies OssuaryPlacement)),
)

const CANDLES: readonly OssuaryPlacement[] = Object.freeze([
  [-6.62, -0.72], [-6.48, -0.78], [-4.55, 1.22], [-4.4, 1.3], [-9.18, 3.86], [-9.05, 3.92],
].map(([x, z], index) => Object.freeze({ id: `candle.${index}`, area: x > -7 ? 'refuge' : 'first-combat', position: [x, 0.15, z], rotation: [0, 0, 0], scale: [1, 0.75 + (index % 3) * 0.16, 1] } satisfies OssuaryPlacement)))

const FLAMES: readonly OssuaryPlacement[] = Object.freeze(
  CANDLES.map((entry) => Object.freeze({ ...entry, position: [entry.position[0], 0.34 + (entry.scale[1] - 0.75) * 0.12, entry.position[2]], scale: [1, 1.4, 1] } satisfies OssuaryPlacement)),
)

const BANNERS: readonly OssuaryPlacement[] = Object.freeze([
  Object.freeze({ id: 'banner.watch.0', area: 'first-combat', position: [-10.59, 1.15, 0.35], rotation: [0, Math.PI / 2, -0.06], scale: [0.8, 1, 1] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'banner.divider.0', area: 'corridor', position: [-3.41, 1.14, 2.65], rotation: [0, Math.PI / 2, 0.08], scale: [0.68, 0.9, 1] } satisfies OssuaryPlacement),
])

const ROOTS: readonly OssuaryPlacement[] = Object.freeze([
  Object.freeze({ id: 'root.watch.0', area: 'first-combat', position: [-10.56, 0.34, 2.85], rotation: [0, Math.PI / 2, 0.35], scale: [1, 1.3, 1] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'root.combat.0', area: 'first-combat', position: [-8.58, 0.17, 4.35], rotation: [Math.PI / 2, 0.2, 0], scale: [0.8, 1, 1.25] } satisfies OssuaryPlacement),
])

const WALL_BREAKS: readonly OssuaryPlacement[] = Object.freeze([
  Object.freeze({ id: 'break.watch.0', area: 'first-combat', position: [-10.7, 1.55, 0.98], rotation: [0.2, 0.4, 0.1], scale: [0.55, 0.42, 0.65] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'break.watch.1', area: 'first-combat', position: [-10.67, 1.57, 3.95], rotation: [-0.1, 0.9, -0.18], scale: [0.68, 0.48, 0.55] } satisfies OssuaryPlacement),
  Object.freeze({ id: 'break.divider.0', area: 'corridor', position: [-3.31, 1.56, 1.9], rotation: [0.12, 0.25, 0.22], scale: [0.58, 0.42, 0.72] } satisfies OssuaryPlacement),
])

const NICHE_ARCHES: readonly OssuaryPlacement[] = Object.freeze(
  OSSUARY_TOMB_NICHES.map((entry) =>
    Object.freeze({
      ...entry,
      id: `${entry.id}.arch`,
      position: [entry.position[0] + (entry.position[0] < -8 ? 0.045 : -0.045), 1.18, entry.position[2]],
      rotation: [0, Math.PI / 2, 0],
      scale: [0.92, 1.12, 0.92],
    } satisfies OssuaryPlacement),
  ),
)

function Instances({
  name,
  placements,
  geometry,
  material,
  castShadow = true,
  receiveShadow = true,
}: {
  readonly name: string
  readonly placements: readonly OssuaryPlacement[]
  readonly geometry: BufferGeometry
  readonly material: MeshStandardMaterial
  readonly castShadow?: boolean
  readonly receiveShadow?: boolean
}) {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (mesh === null) return
    const transform = new Object3D()
    placements.forEach((entry, index) => {
      transform.position.set(...entry.position)
      transform.rotation.set(...entry.rotation)
      transform.scale.set(...entry.scale)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [placements])

  return (
    <instancedMesh
      ref={ref}
      name={name}
      args={[geometry, material, placements.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled
    />
  )
}

function CorridorArchitecture() {
  return (
    <group>
      <Instances name="ossuary-corridor-arches" placements={CORRIDOR_ARCHES} geometry={ARCH_GEOMETRY} material={MATERIALS.bone} />
      <Instances name="ossuary-corridor-ribs" placements={CORRIDOR_RIBS} geometry={ARCH_RIB_GEOMETRY} material={MATERIALS.stone} />
      <mesh position={[-8.25, 2.46, 1.76]} rotation={[0, -0.62, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.16, 0.28, 0.44, 8]} />
        <primitive attach="material" object={MATERIALS.bronze} />
      </mesh>
      <mesh position={[-8.25, 2.18, 1.76]} castShadow>
        <torusGeometry args={[0.17, 0.045, 6, 18]} />
        <primitive attach="material" object={MATERIALS.bone} />
      </mesh>
    </group>
  )
}

function CombatVeilMonolith() {
  return (
    <group position={[-10.4, 0, 1.2]} scale={[0.62, 1, 0.62]} userData={{ landmarkId: 'landmark.combat-veil-monolith' }}>
      <mesh geometry={MONOLITH_GEOMETRY} material={MATERIALS.stone} position={[0, 1.48, 0]} castShadow receiveShadow />
      <mesh geometry={MONOLITH_CAP_GEOMETRY} material={MATERIALS.bone} position={[0, 3.02, 0]} scale={[0.75, 1.15, 0.75]} castShadow />
      <mesh position={[0.405, 1.62, 0]} rotation={[0, 0, 0.34]} castShadow>
        <boxGeometry args={[0.035, 1.45, 0.1]} />
        <primitive attach="material" object={MATERIALS.veil} />
      </mesh>
      <mesh position={[0.42, 2.18, 0]} rotation={[0, 0, -0.46]} castShadow>
        <boxGeometry args={[0.035, 0.62, 0.11]} />
        <primitive attach="material" object={MATERIALS.veil} />
      </mesh>
      <pointLight position={[0, 2.35, 0]} intensity={0.52} distance={4.8} color="#68cfc4" />
    </group>
  )
}

function CombatReliquaryPlinth() {
  return (
    <group position={[-8.25, 0, 4.25]} userData={{ dressingForSolidId: 'blocker.first-combat' }}>
      <mesh geometry={RELIQUARY_PLINTH_GEOMETRY} material={MATERIALS.stone} position={[0, 0.8, 0]} castShadow receiveShadow />
      <mesh geometry={MONOLITH_CAP_GEOMETRY} material={MATERIALS.bone} position={[0, 1.66, 0]} scale={[0.7, 0.42, 0.7]} castShadow />
      <mesh position={[0, 0.94, 0.566]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.24, 0.035, 5, 18]} />
        <primitive attach="material" object={MATERIALS.bronze} />
      </mesh>
      <mesh position={[0.18, 1.83, -0.02]} rotation={[0.1, 0.25, 1.2]} castShadow>
        <cylinderGeometry args={[0.11, 0.16, 0.9, 7]} />
        <primitive attach="material" object={MATERIALS.bone} />
      </mesh>
    </group>
  )
}

function VeilWisps() {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (group === null) return
    group.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.045
    group.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.025
  })

  return (
    <group ref={groupRef}>
      <Instances name="ossuary-veil-wisps" placements={WISP_PLACEMENTS} geometry={WISP_GEOMETRY} material={MATERIALS.veil} castShadow={false} receiveShadow={false} />
    </group>
  )
}

/** Production-candidate render shell. Gameplay collision remains in connectedLevelCollision.ts. */
export function OssuaryEnvironmentKit() {
  return (
    <group userData={{ productionAssetId: 'world.kit.ossuary-hero' }} dispose={null}>
      <Instances name="ossuary-floor-slabs" placements={OSSUARY_FLOOR_SLABS} geometry={FLOOR_GEOMETRY} material={MATERIALS.floor} castShadow={false} />
      <Instances name="ossuary-floor-inlays" placements={OSSUARY_FLOOR_INLAYS} geometry={INLAY_GEOMETRY} material={MATERIALS.inlay} castShadow={false} />
      <Instances name="ossuary-wall-bays" placements={OSSUARY_WALL_BAYS} geometry={WALL_PANEL_GEOMETRY} material={MATERIALS.stone} />
      <Instances name="ossuary-wall-recesses" placements={OSSUARY_TOMB_NICHES} geometry={NICHE_GEOMETRY} material={MATERIALS.recess} castShadow={false} />
      <Instances name="ossuary-niche-arches" placements={NICHE_ARCHES} geometry={NICHE_ARCH_GEOMETRY} material={MATERIALS.bronze} castShadow={false} />
      <Instances name="ossuary-buttresses" placements={OSSUARY_BUTTRESSES} geometry={BUTTRESS_GEOMETRY} material={MATERIALS.stone} />
      <Instances name="ossuary-sarcophagi" placements={OSSUARY_SARCOPHAGI} geometry={SARCOPHAGUS_GEOMETRY} material={MATERIALS.stone} />
      <Instances
        name="ossuary-sarcophagus-lids"
        placements={SARCOPHAGUS_LIDS}
        geometry={SARCOPHAGUS_LID_GEOMETRY}
        material={MATERIALS.bone}
      />
      <Instances name="ossuary-rubble" placements={OSSUARY_RUBBLE} geometry={RUBBLE_GEOMETRY} material={MATERIALS.stone} />
      <Instances name="ossuary-wall-breaks" placements={WALL_BREAKS} geometry={RUBBLE_GEOMETRY} material={MATERIALS.stone} />
      <Instances name="ossuary-markers" placements={MARKER_PLACEMENTS} geometry={MARKER_GEOMETRY} material={MATERIALS.stone} />
      <Instances name="ossuary-marker-caps" placements={MARKER_CAPS} geometry={MARKER_CAP_GEOMETRY} material={MATERIALS.bone} />
      <Instances name="ossuary-candles" placements={CANDLES} geometry={CANDLE_GEOMETRY} material={MATERIALS.bone} castShadow={false} />
      <Instances name="ossuary-candle-flames" placements={FLAMES} geometry={FLAME_GEOMETRY} material={MATERIALS.ember} castShadow={false} receiveShadow={false} />
      <Instances name="ossuary-banners" placements={BANNERS} geometry={BANNER_GEOMETRY} material={MATERIALS.cloth} />
      <Instances name="ossuary-roots" placements={ROOTS} geometry={ROOT_GEOMETRY} material={MATERIALS.iron} />
      <CorridorArchitecture />
      <CombatVeilMonolith />
      <CombatReliquaryPlinth />
      <VeilWisps />
      <pointLight position={[-8.1, 2.5, 1.7]} intensity={0.58} distance={5.8} color="#c77a42" />
    </group>
  )
}
