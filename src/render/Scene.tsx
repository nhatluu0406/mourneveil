import { Physics, RigidBody, useRapier } from '@react-three/rapier'
import { useEffect } from 'react'
import type { PlayerRuntime } from '../game/character/playerRuntime'
import { FIXED_STEP_SECONDS } from '../game/core/fixedStepClock'
import { PlayerPhysicsBody } from '../physics/PlayerPhysicsBody'
import { FollowCameraRig } from './FollowCameraRig'
import type { CameraDiagnostic } from './followCamera'

interface SceneProps {
  onPhysicsReady: () => void
  onCameraDiagnostic?: (diagnostic: CameraDiagnostic) => void
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
        <meshStandardMaterial color="#6a7870" roughness={0.88} />
      </mesh>
    </RigidBody>
  )
}

function OrientationMarker() {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh>
        <boxGeometry args={[0.9, 0.04, 0.08]} />
        <meshStandardMaterial color="#c9b07a" roughness={0.7} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.08, 0.04, 0.9]} />
        <meshStandardMaterial color="#7f9e8c" roughness={0.7} />
      </mesh>
    </group>
  )
}

function FoundationWorld({ onPhysicsReady, runtime }: SceneProps) {
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={FIXED_STEP_SECONDS}>
      <PhysicsReadySignal onReady={onPhysicsReady} />
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[12, 0.5, 12]} />
          <meshStandardMaterial color="#26302c" roughness={0.94} />
        </mesh>
      </RigidBody>
      <gridHelper
        args={[12, 12, '#6d8074', '#36423c']}
        position={[0, 0.01, 0]}
      />
      <OrientationMarker />
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#a88455" roughness={0.76} />
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

export function Scene({
  onPhysicsReady,
  onCameraDiagnostic,
  runtime,
}: SceneProps) {
  return (
    <>
      <color attach="background" args={['#10141a']} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        intensity={2.35}
        position={[9, 14, 6]}
        shadow-mapSize={[1024, 1024]}
      />
      <FollowCameraRig runtime={runtime} onDiagnostic={onCameraDiagnostic} />
      <FoundationWorld onPhysicsReady={onPhysicsReady} runtime={runtime} />
    </>
  )
}
