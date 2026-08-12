import { getOssuaryMaterial } from '../materials'
import type { WorldObjectPlacement } from '../../worldObjectTypes'
import {
  PRACTICAL_FIXTURE_GEOMETRIES,
  PRACTICAL_FLAME_GEO,
  PRACTICAL_FLAME_VEIL,
  PRACTICAL_FLAME_WARM,
  PRACTICAL_GLOW_GEO,
  PRACTICAL_GLOW_VEIL,
  PRACTICAL_GLOW_WARM,
} from './practicalLightGeometries'

const WARM = '#f1a15f'
const VEIL = '#8fe9df'

function FlameCue({
  veil = false,
  scale = 1,
  glow = true,
}: {
  readonly veil?: boolean
  readonly scale?: number
  readonly glow?: boolean
}) {
  return (
    <group scale={scale}>
      <mesh
        geometry={PRACTICAL_FLAME_GEO}
        material={veil ? PRACTICAL_FLAME_VEIL : PRACTICAL_FLAME_WARM}
        scale={[0.72, 1.25, 0.72]}
      />
      {glow ? (
        <mesh
          geometry={PRACTICAL_GLOW_GEO}
          material={veil ? PRACTICAL_GLOW_VEIL : PRACTICAL_GLOW_WARM}
          scale={1.55}
        />
      ) : null}
    </group>
  )
}

function WallSconce({ actualLight }: { readonly actualLight: boolean }) {
  return (
    <group>
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.sconceIron}
        material={getOssuaryMaterial('iron')}
        castShadow
      />
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.sconceBronze}
        material={getOssuaryMaterial('bronze')}
        castShadow
      />
      <group position={[0, 0.32, 0.46]}>
        <FlameCue glow={actualLight} />
      </group>
      {actualLight ? (
        <pointLight position={[0, 0.42, 0.58]} intensity={6.5} distance={8.2} decay={2} color={WARM} />
      ) : null}
    </group>
  )
}

function Brazier({ actualLight }: { readonly actualLight: boolean }) {
  return (
    <group>
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.brazierIron}
        material={getOssuaryMaterial('iron')}
        castShadow
      />
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.brazierBronze}
        material={getOssuaryMaterial('bronze')}
        castShadow
      />
      <group position={[0, 0.98, 0]}>
        <FlameCue scale={1.32} />
      </group>
      {actualLight ? (
        <pointLight position={[0, 1.3, 0]} intensity={8.5} distance={10.5} decay={2} color={WARM} />
      ) : null}
    </group>
  )
}

function VeilLamp({ actualLight }: { readonly actualLight: boolean }) {
  return (
    <group>
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.veilLampPole}
        material={getOssuaryMaterial('verdigris')}
        castShadow
      />
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.veilLampIron}
        material={getOssuaryMaterial('iron')}
        castShadow
      />
      <group position={[0, 1.38, 0]}>
        <FlameCue veil scale={1.18} glow={actualLight} />
      </group>
      {actualLight ? (
        <pointLight position={[0, 1.55, 0]} intensity={5.5} distance={8.5} decay={2} color={VEIL} />
      ) : null}
    </group>
  )
}

function CandleCluster() {
  return (
    <group>
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.candleClusterBone}
        material={getOssuaryMaterial('bone')}
      />
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.candleClusterFlame}
        material={PRACTICAL_FLAME_WARM}
      />
    </group>
  )
}

/** Presentation-only fixture. `actual-light` selects sparse photometric sources; all fixtures remain visual projections. */
export function PracticalLightFixture({ placement }: { readonly placement: WorldObjectPlacement }) {
  const actualLight = placement.variant === 'actual-light'
  let fixture = null
  switch (placement.objectId) {
    case 'ossuary.light.wall-sconce':
      fixture = <WallSconce actualLight={actualLight} />
      break
    case 'ossuary.light.brazier':
      fixture = <Brazier actualLight={actualLight} />
      break
    case 'ossuary.light.veil-lamp':
      fixture = <VeilLamp actualLight={actualLight} />
      break
    case 'ossuary.light.candle-cluster':
      fixture = <CandleCluster />
      break
  }
  return (
    <group
      position={[...placement.position]}
      rotation={[...placement.rotation]}
      scale={placement.scale === undefined ? [1, 1, 1] : [...placement.scale]}
      userData={{
        practicalLightFixture: placement.objectId,
        actualLight,
        instanceId: placement.instanceId,
      }}
    >
      {fixture}
    </group>
  )
}
