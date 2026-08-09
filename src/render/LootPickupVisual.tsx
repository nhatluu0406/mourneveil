import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'

interface LootPickupVisualProps {
  runtime: GameRuntime
}

export function LootPickupVisual({ runtime }: LootPickupVisualProps) {
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    const loot = runtime.snapshot().lootPickup
    const group = groupRef.current
    if (group === null) return
    group.visible = loot.active && loot.position !== null
    if (!loot.active || loot.position === null) return
    group.position.set(loot.position.x, 0.45, loot.position.z)
  })

  return (
    <group ref={groupRef} visible={false}>
      <mesh castShadow>
        <boxGeometry args={[0.35, 0.2, 0.35]} />
        <meshStandardMaterial color="#d2b56b" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#f0e2b0" emissive="#8a7030" emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}
