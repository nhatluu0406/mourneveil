import { Physics, RigidBody, useRapier } from '@react-three/rapier'
import { useEffect } from 'react'
import type { PlayerRuntime } from '../game/character/playerRuntime'
import { FIXED_STEP_SECONDS } from '../game/core/fixedStepClock'
import { PlayerPhysicsBody } from '../physics/PlayerPhysicsBody'

interface SceneProps {
  onPhysicsReady: () => void
  runtime: PlayerRuntime
}

function PhysicsReadySignal({ onReady }: { onReady: () => void }) {
  useRapier()

  useEffect(() => {
    onReady()
  }, [onReady])

  return null
}

function BoundaryWall({
  position,
  size,
}: {
  position: [number, number, number]
  size: [number, number, number]
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#4b5650" roughness={0.9} />
      </mesh>
    </RigidBody>
  )
}

function FoundationWorld({ onPhysicsReady, runtime }: SceneProps) {
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={FIXED_STEP_SECONDS}>
      <PhysicsReadySignal onReady={onPhysicsReady} />
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[12, 0.5, 12]} />
          <meshStandardMaterial color="#303a36" roughness={0.92} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#8c7657" roughness={0.78} />
        </mesh>
      </RigidBody>
      <BoundaryWall position={[-5.75, 0.75, 0]} size={[0.5, 1.5, 12]} />
      <BoundaryWall position={[5.75, 0.75, 0]} size={[0.5, 1.5, 12]} />
      <BoundaryWall position={[0, 0.75, -5.75]} size={[11, 1.5, 0.5]} />
      <BoundaryWall position={[0, 0.75, 5.75]} size={[11, 1.5, 0.5]} />
      <PlayerPhysicsBody runtime={runtime} />
    </Physics>
  )
}

export function Scene({ onPhysicsReady, runtime }: SceneProps) {
  return (
    <>
      <color attach="background" args={['#11151b']} />
      <ambientLight intensity={0.65} />
      <directionalLight
        castShadow
        intensity={2.2}
        position={[7, 10, 5]}
        shadow-mapSize={[1024, 1024]}
      />
      <FoundationWorld onPhysicsReady={onPhysicsReady} runtime={runtime} />
    </>
  )
}
