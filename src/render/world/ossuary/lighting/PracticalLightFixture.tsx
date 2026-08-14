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
      />
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.sconceBronze}
        material={getOssuaryMaterial('bronze')}
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
      />
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.brazierBronze}
        material={getOssuaryMaterial('bronze')}
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
      />
      <mesh
        geometry={PRACTICAL_FIXTURE_GEOMETRIES.veilLampIron}
        material={getOssuaryMaterial('iron')}
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

function Candelabrum({ actualLight }: { readonly actualLight: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.58, 0]}><cylinderGeometry args={[0.055, 0.11, 1.16, 8]} /><primitive attach="material" object={getOssuaryMaterial('bronze')} /></mesh>
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.28, 0.04, 6, 18]} /><primitive attach="material" object={getOssuaryMaterial('iron')} /></mesh>
      {[-0.31, 0, 0.31].map((x, index) => <group key={x} position={[x, 1.12 + (index === 1 ? 0.18 : 0), 0]}><mesh><cylinderGeometry args={[0.035, 0.045, 0.22, 7]} /><primitive attach="material" object={getOssuaryMaterial('bone')} /></mesh><group position={[0, 0.16, 0]}><FlameCue scale={0.46} glow={false} /></group></group>)}
      {actualLight ? <pointLight position={[0, 1.48, 0]} intensity={4.2} distance={6.8} decay={2} color={WARM} /> : null}
    </group>
  )
}

function ReliquaryLantern({ actualLight }: { readonly actualLight: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.025, 0.025, 1.24, 6]} /><primitive attach="material" object={getOssuaryMaterial('iron')} /></mesh>
      <mesh position={[0, -0.05, 0]}><octahedronGeometry args={[0.3, 0]} /><primitive attach="material" object={getOssuaryMaterial('bronze')} /></mesh>
      {[0, Math.PI / 2].map((rotation) => <mesh key={rotation} position={[0, -0.05, 0]} rotation={[0, rotation, 0]}><torusGeometry args={[0.33, 0.025, 5, 14]} /><primitive attach="material" object={getOssuaryMaterial('iron')} /></mesh>)}
      <group position={[0, -0.05, 0]}><FlameCue veil scale={0.72} glow={actualLight} /></group>
      {actualLight ? <pointLight position={[0, -0.05, 0]} intensity={4.8} distance={8} decay={2} color={VEIL} /> : null}
    </group>
  )
}

function DoubleSconce({ actualLight }: { readonly actualLight: boolean }) {
  return <group>
    {[-0.3, 0.3].map((x) => <group key={x} position={[x, 0, 0]} scale={0.72}><mesh geometry={PRACTICAL_FIXTURE_GEOMETRIES.sconceIron} material={getOssuaryMaterial('iron')}/><mesh geometry={PRACTICAL_FIXTURE_GEOMETRIES.sconceBronze} material={getOssuaryMaterial('bronze')}/><group position={[0, 0.32, 0.46]}><FlameCue scale={0.8} glow={actualLight}/></group></group>)}
    {actualLight ? <pointLight position={[0, 0.48, 0.34]} intensity={6.2} distance={8.5} decay={2} color={WARM}/> : null}
  </group>
}

function ProcessionalTorch({ actualLight }: { readonly actualLight: boolean }) {
  return <group>
    <mesh position={[0, 0.78, 0]}><cylinderGeometry args={[0.045, 0.085, 1.56, 7]}/><primitive attach="material" object={getOssuaryMaterial('iron')}/></mesh>
    <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.24, 0.12, 0.34, 7, 1, true]}/><primitive attach="material" object={getOssuaryMaterial('bronze')}/></mesh>
    <group position={[0, 1.72, 0]}><FlameCue scale={0.92} glow={actualLight}/></group>
    {actualLight ? <pointLight position={[0, 1.85, 0]} intensity={6.8} distance={9.2} decay={2} color={WARM}/> : null}
  </group>
}

function EmberBowl({ actualLight }: { readonly actualLight: boolean }) {
  return <group>
    <mesh geometry={PRACTICAL_FIXTURE_GEOMETRIES.brazierBronze} material={getOssuaryMaterial('bronze')} position={[0, -0.48, 0]} scale={[1.1, 0.78, 1.1]}/>
    <group position={[0, 0.36, 0]}><FlameCue scale={1.05} glow={actualLight}/></group>
    {actualLight ? <pointLight position={[0, 0.72, 0]} intensity={7.4} distance={9.5} decay={2} color={WARM}/> : null}
  </group>
}

function SpectralReliquary({ actualLight }: { readonly actualLight: boolean }) {
  return <group>
    <mesh geometry={PRACTICAL_FIXTURE_GEOMETRIES.veilLampPole} material={getOssuaryMaterial('darkStone')} scale={[1.8, 0.92, 1.8]}/>
    <mesh geometry={PRACTICAL_FIXTURE_GEOMETRIES.veilLampIron} material={getOssuaryMaterial('iron')} scale={1.3}/>
    <group position={[0, 1.35, 0]}><FlameCue veil scale={1.05} glow/></group>
    {actualLight ? <pointLight position={[0, 1.55, 0]} intensity={5.8} distance={9} decay={2} color={VEIL}/> : null}
  </group>
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
    case 'ossuary.light.candelabrum':
      fixture = <Candelabrum actualLight={actualLight} />
      break
    case 'ossuary.light.reliquary-lantern':
      fixture = <ReliquaryLantern actualLight={actualLight} />
      break
    case 'ossuary.light.double-sconce':
      fixture = <DoubleSconce actualLight={actualLight} />
      break
    case 'ossuary.light.processional-torch':
      fixture = <ProcessionalTorch actualLight={actualLight} />
      break
    case 'ossuary.light.ember-bowl':
      fixture = <EmberBowl actualLight={actualLight} />
      break
    case 'ossuary.light.spectral-reliquary':
      fixture = <SpectralReliquary actualLight={actualLight} />
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
