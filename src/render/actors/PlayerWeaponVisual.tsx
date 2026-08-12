import type { Ref } from 'react'
import type { Group, MeshStandardMaterial } from 'three'
import { createGravebrandGeometry, createOathbladeGeometry, createVeilThornGeometry } from '../productionGeometry'

const OATHBLADE = createOathbladeGeometry()
const GRAVEBRAND = createGravebrandGeometry()
const VEIL_THORN = createVeilThornGeometry()

export type PlayerWeaponVisualId = 'oathblade' | 'gravebrand' | 'veil-thorn'

interface VariantProps {
  readonly groupRef: Ref<Group>
  readonly materialRef: Ref<MeshStandardMaterial>
  readonly id: PlayerWeaponVisualId
}

function Variant({ groupRef, materialRef, id }: VariantProps) {
  const grave = id === 'gravebrand'
  const thorn = id === 'veil-thorn'
  const geometry = grave ? GRAVEBRAND : thorn ? VEIL_THORN : OATHBLADE
  const blade = grave ? '#69706d' : thorn ? '#abcfd1' : '#aeb5ad'
  const metal = grave ? '#83613d' : thorn ? '#527c79' : '#91714b'
  const glow = grave ? '#8f4d25' : thorn ? '#4bc3c2' : '#2b8c8c'
  return (
    <group ref={groupRef} visible={id === 'oathblade'} userData={{ productionAssetId: `weapon.player.${id}` }}>
      <mesh castShadow><primitive attach="geometry" object={geometry}/><meshStandardMaterial ref={materialRef} color={blade} roughness={grave ? 0.42 : 0.24} metalness={grave ? 0.86 : 0.72}/></mesh>
      <mesh position={[0, -0.012, grave ? -0.24 : thorn ? -0.34 : -0.31]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[thorn ? 0.009 : grave ? 0.026 : 0.014, grave ? 0.26 : 0.34, 0.009]}/>
        <meshStandardMaterial color={thorn ? '#c4fbf3' : grave ? '#d19a57' : '#89d8d9'} emissive={glow} emissiveIntensity={0.8} roughness={0.3}/>
      </mesh>
      <group position={[0, 0, 0.065]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.036, grave ? 0.075 : 0.055, grave ? 0.36 : 0.28, grave ? 8 : 6]}/><meshStandardMaterial color={metal} roughness={0.4} metalness={0.72}/></mesh>
      </group>
      <mesh castShadow position={[0, 0, 0.205]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.034, 0.045, 0.24, 8]}/><meshStandardMaterial color="#171817" roughness={0.92}/></mesh>
      <mesh castShadow position={[0, 0, 0.335]} rotation={[0, Math.PI / 4, 0]}><octahedronGeometry args={[grave ? 0.085 : 0.062, 0]}/><meshStandardMaterial color={metal} emissive={glow} emissiveIntensity={0.34} roughness={0.35} metalness={0.5}/></mesh>
    </group>
  )
}

export interface PlayerWeaponVisualProps {
  readonly oathbladeRef: Ref<Group>
  readonly gravebrandRef: Ref<Group>
  readonly veilThornRef: Ref<Group>
  readonly oathbladeMaterialRef: Ref<MeshStandardMaterial>
  readonly gravebrandMaterialRef: Ref<MeshStandardMaterial>
  readonly veilThornMaterialRef: Ref<MeshStandardMaterial>
}

/** All authored variants stay mounted; simulation equipment only selects visibility. */
export function PlayerWeaponVisual(props: PlayerWeaponVisualProps) {
  return <>
    <Variant groupRef={props.oathbladeRef} materialRef={props.oathbladeMaterialRef} id="oathblade"/>
    <Variant groupRef={props.gravebrandRef} materialRef={props.gravebrandMaterialRef} id="gravebrand"/>
    <Variant groupRef={props.veilThornRef} materialRef={props.veilThornMaterialRef} id="veil-thorn"/>
  </>
}
