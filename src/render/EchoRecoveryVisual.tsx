import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Group } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'

interface EchoRecoveryVisualProps {
  runtime: GameRuntime
}

export function EchoRecoveryVisual({ runtime }: EchoRecoveryVisualProps) {
  const groupRef = useRef<Group>(null)
  const [label, setLabel] = useState('0')

  useFrame(() => {
    const recovery = runtime.snapshot().echoRecovery
    const group = groupRef.current
    if (group === null) return
    group.visible = recovery.active && recovery.position !== null
    if (!recovery.active || recovery.position === null) return
    group.position.set(recovery.position.x, 0.55, recovery.position.z)
    const next = String(recovery.amount)
    setLabel((current) => (current === next ? current : next))
  })

  return (
    <group ref={groupRef} visible={false}>
      <mesh castShadow>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          color="#7ec8e3"
          emissive="#24566a"
          emissiveIntensity={0.55}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#e8f7ff" emissive="#9ad7ef" emissiveIntensity={0.8} />
      </mesh>
      {/* amount encoded via scale so diagnostics remain authoritative */}
      <mesh position={[0, -0.35, 0]} scale={[Number(label) > 0 ? 1 : 0.01, 0.08, 1]}>
        <boxGeometry args={[0.55, 0.06, 0.55]} />
        <meshStandardMaterial color="#3d6f82" roughness={0.8} />
      </mesh>
    </group>
  )
}
