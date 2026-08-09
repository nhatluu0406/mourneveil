import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'

interface LootPickupVisualProps {
  runtime: GameRuntime
}

export function LootPickupVisual({ runtime }: LootPickupVisualProps) {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const loot = runtime.snapshot().lootPickup
    const group = groupRef.current
    if (group === null) return
    group.visible = loot.active && loot.position !== null
    if (!loot.active || loot.position === null) return
    group.position.set(loot.position.x, 0.38 + Math.sin(clock.elapsedTime * 3) * 0.04, loot.position.z)
    group.rotation.y = clock.elapsedTime * 0.8
  })

  return (
    <group ref={groupRef} visible={false}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.16, 0.22]} />
        <meshStandardMaterial
          color={MOURNEVEIL_PALETTE.loot.chest}
          roughness={0.55}
          metalness={0.28}
        />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <octahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial
          color={MOURNEVEIL_PALETTE.loot.gem}
          emissive={MOURNEVEIL_PALETTE.loot.glow}
          emissiveIntensity={0.45}
        />
      </mesh>
    </group>
  )
}
