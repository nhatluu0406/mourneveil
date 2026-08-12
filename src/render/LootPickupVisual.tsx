import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { BoxGeometry, MeshStandardMaterial, OctahedronGeometry, TetrahedronGeometry, type Group, type Mesh } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { getItemDefinition } from '../game/items/itemDefinition'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'

interface LootPickupVisualProps { runtime: GameRuntime }

const LOOT_CORE = new OctahedronGeometry(0.16, 0)
const LOOT_SHARD = new TetrahedronGeometry(0.065, 0)
const EQUIP_STREAK = new BoxGeometry(0.035, 0.24, 0.035)
const LOOT_IRON = new MeshStandardMaterial({ color: '#8b704b', roughness: 0.42, metalness: 0.68 })
const LOOT_VEIL = new MeshStandardMaterial({ color: MOURNEVEIL_PALETTE.loot.gem, emissive: MOURNEVEIL_PALETTE.loot.glow, emissiveIntensity: 0.8 })
const RELIQUARY = new MeshStandardMaterial({ color: '#d3c18b', emissive: '#5caaa8', emissiveIntensity: 0.65 })
const BOUND = new MeshStandardMaterial({ color: '#c69a58', emissive: '#75411f', emissiveIntensity: 0.75 })
const EQUIP = new MeshStandardMaterial({ color: '#a9e1d8', emissive: '#397b77', emissiveIntensity: 0.8 })

/** Presentation-only loot object plus bounded pickup/equip affirmations from stable runtime cues. */
export function LootPickupVisual({ runtime }: LootPickupVisualProps) {
  const pickupRef = useRef<Group>(null)
  const reliquaryRef = useRef<Group>(null)
  const acquisitionRef = useRef<Group>(null)
  const equipRef = useRef<Group>(null)
  const lastAcquisitionStep = useRef<number | null>(null)
  const acquisitionIsReliquary = useRef(false)
  const acquisitionStartedAt = useRef(-10)
  const lastEquipment = useRef('')
  const equipStartedAt = useRef(-10)

  useFrame(({ clock }) => {
    const snapshot = runtime.snapshot()
    const loot = snapshot.lootPickup
    const pickup = pickupRef.current
    const reliquary = reliquaryRef.current
    const acquisition = acquisitionRef.current
    const equip = equipRef.current
    if (pickup === null || reliquary === null || acquisition === null || equip === null) return

    pickup.visible = loot.active && loot.position !== null
    if (loot.active && loot.position !== null) {
      pickup.position.set(loot.position.x, 0.38 + Math.sin(clock.elapsedTime * 3) * 0.04, loot.position.z)
      pickup.rotation.y = clock.elapsedTime * 0.8
      reliquary.visible = getItemDefinition(loot.itemId ?? '')?.rarity === 'reliquary'
    }

    const cueStep = snapshot.lastLootAcquisition?.simulationStep ?? null
    if (cueStep !== null && cueStep !== lastAcquisitionStep.current) {
      lastAcquisitionStep.current = cueStep
      acquisitionIsReliquary.current = snapshot.lastLootAcquisition?.rarity === 'reliquary'
      acquisitionStartedAt.current = clock.elapsedTime
    }
    const acquisitionAge = clock.elapsedTime - acquisitionStartedAt.current
    acquisition.visible = acquisitionAge >= 0 && acquisitionAge < 0.9
    if (acquisition.visible) {
      acquisition.position.set(snapshot.player.position.x, 0.34, snapshot.player.position.z)
      acquisition.rotation.y = acquisitionAge * (acquisitionIsReliquary.current ? -3.1 : 2.4)
      acquisition.scale.setScalar((acquisitionIsReliquary.current ? 0.82 : 0.65) + acquisitionAge * (acquisitionIsReliquary.current ? 1.45 : 1.1))
      acquisition.children.forEach((child, index) => {
        const mesh = child as Mesh
        mesh.material = acquisitionIsReliquary.current ? RELIQUARY : BOUND
        mesh.rotation.z = 0.55 + index * 0.12 + acquisitionAge * 3
      })
    }

    const equipmentKey = `${snapshot.equipment.weaponItemId ?? ''}|${snapshot.equipment.charmItemId ?? ''}`
    if (lastEquipment.current !== '' && equipmentKey !== lastEquipment.current) equipStartedAt.current = clock.elapsedTime
    lastEquipment.current = equipmentKey
    const equipAge = clock.elapsedTime - equipStartedAt.current
    equip.visible = equipAge >= 0 && equipAge < 0.65
    if (equip.visible) {
      equip.position.set(snapshot.player.position.x, 0.25, snapshot.player.position.z)
      equip.scale.setScalar(0.72 + equipAge * 0.5)
      equip.rotation.y = -equipAge * 1.8
    }
  })

  return <>
    <group ref={pickupRef} visible={false}>
      <mesh castShadow rotation={[0, Math.PI / 4, 0]} geometry={LOOT_CORE} material={LOOT_IRON}/>
      <mesh position={[0, 0.13, 0]} scale={0.53} geometry={LOOT_CORE} material={LOOT_VEIL}/>
      <group ref={reliquaryRef} visible={false}>
        {[0, 1, 2, 3].map((index) => <mesh key={index} geometry={LOOT_SHARD} material={RELIQUARY} position={[Math.sin(index * Math.PI / 2) * 0.21, 0.02, Math.cos(index * Math.PI / 2) * 0.21]} rotation={[0, index * Math.PI / 2, 0.45]} scale={1.08}/>)}
      </group>
    </group>
    <group ref={acquisitionRef} visible={false}>
      {[0, 1, 2, 3, 4, 5].map((index) => <mesh key={index} geometry={LOOT_SHARD} material={BOUND} position={[Math.sin(index * Math.PI / 3) * 0.34, 0.12 + (index % 2) * 0.12, Math.cos(index * Math.PI / 3) * 0.34]} rotation={[0.4, index * Math.PI / 3, 0.55]}/>)}
    </group>
    <group ref={equipRef} visible={false}>
      {[0, 1, 2, 3].map((index) => <mesh key={index} geometry={EQUIP_STREAK} material={EQUIP} position={[Math.sin(index * Math.PI / 2) * 0.42, 0.3, Math.cos(index * Math.PI / 2) * 0.42]} rotation={[0.2, index * Math.PI / 2, 0.7]}/>)}
    </group>
  </>
}
