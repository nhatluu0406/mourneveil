import { Physics, RigidBody, useRapier } from '@react-three/rapier'
import { useEffect } from 'react'

interface SceneProps {
  onPhysicsReady: () => void
}

function PhysicsReadySignal({ onReady }: { onReady: () => void }) {
  useRapier()

  useEffect(() => {
    onReady()
  }, [onReady])

  return null
}

function FoundationWorld({ onPhysicsReady }: SceneProps) {
  return (
    <Physics gravity={[0, -9.81, 0]}>
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
    </Physics>
  )
}

export function Scene({ onPhysicsReady }: SceneProps) {
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
      <FoundationWorld onPhysicsReady={onPhysicsReady} />
    </>
  )
}
