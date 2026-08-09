import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'

interface EchoRecoveryVisualProps {
  runtime: GameRuntime
}

export function EchoRecoveryVisual({ runtime }: EchoRecoveryVisualProps) {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const recovery = runtime.snapshot().echoRecovery
    const group = groupRef.current
    if (group === null) return
    group.visible = recovery.active && recovery.position !== null
    if (!recovery.active || recovery.position === null) return
    const bob = Math.sin(clock.elapsedTime * 2.4) * 0.08
    group.position.set(recovery.position.x, 0.62 + bob, recovery.position.z)
    group.rotation.y = clock.elapsedTime * 1.2
  })

  return (
    <group ref={groupRef} visible={false}>
      <mesh castShadow>
        <octahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial
          color={MOURNEVEIL_PALETTE.echo.core}
          emissive={MOURNEVEIL_PALETTE.echo.aura}
          emissiveIntensity={0.7}
          roughness={0.28}
          metalness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <tetrahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial
          color={MOURNEVEIL_PALETTE.echo.tip}
          emissive={MOURNEVEIL_PALETTE.echo.core}
          emissiveIntensity={0.9}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
        <ringGeometry args={[0.28, 0.42, 18]} />
        <meshStandardMaterial
          color={MOURNEVEIL_PALETTE.echo.aura}
          emissive={MOURNEVEIL_PALETTE.echo.aura}
          emissiveIntensity={0.45}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  )
}
