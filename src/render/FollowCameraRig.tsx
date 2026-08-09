import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import {
  FOLLOW_CAMERA_MODE,
  FOLLOW_DAMPING,
  createInitialFollowCameraPose,
  stepFollowCamera,
  type CameraDiagnostic,
  type FollowCameraPose,
} from './followCamera'

interface FollowCameraRigProps {
  runtime: GameRuntime
  onDiagnostic?: (diagnostic: CameraDiagnostic) => void
}

const HIT_IMPULSE_SECONDS = 0.1
const HIT_IMPULSE_DISTANCE = 0.08

/** Presentation-only R3F camera driver. Does not write into simulation. */
export function FollowCameraRig({
  runtime,
  onDiagnostic,
}: FollowCameraRigProps) {
  const { camera } = useThree()
  const poseRef = useRef<FollowCameraPose | null>(null)
  const diagnosticFrameRef = useRef(0)
  const lastHitKeyRef = useRef<string | null>(null)
  const impulseRemainingRef = useRef(0)

  useFrame((_, deltaSeconds) => {
    const snapshot = runtime.snapshot()
    const playerPosition = snapshot.player.position
    const previous =
      poseRef.current ?? createInitialFollowCameraPose(playerPosition)
    const next = stepFollowCamera(
      previous,
      playerPosition,
      deltaSeconds,
      FOLLOW_DAMPING,
    )
    poseRef.current = next

    const lastHit = snapshot.contact.lastHit
    if (lastHit !== null) {
      const hitKey = `${lastHit.executionId}:${lastHit.targetId}:${lastHit.simulationStep}`
      if (hitKey !== lastHitKeyRef.current) {
        lastHitKeyRef.current = hitKey
        impulseRemainingRef.current = HIT_IMPULSE_SECONDS
      }
    }

    impulseRemainingRef.current = Math.max(
      0,
      impulseRemainingRef.current - deltaSeconds,
    )
    const impulseStrength =
      impulseRemainingRef.current > 0
        ? Math.sin((impulseRemainingRef.current / HIT_IMPULSE_SECONDS) * Math.PI) *
          HIT_IMPULSE_DISTANCE
        : 0

    camera.position.set(
      next.position.x + impulseStrength * 0.35,
      next.position.y + impulseStrength * 0.2,
      next.position.z + impulseStrength * 0.35,
    )
    camera.lookAt(next.lookAt.x, next.lookAt.y, next.lookAt.z)
    camera.updateMatrixWorld(true)

    if (onDiagnostic) {
      diagnosticFrameRef.current += 1
      // Throttle React diagnostic updates; camera itself updates every frame.
      if (diagnosticFrameRef.current % 6 === 0) {
        onDiagnostic({
          mode: FOLLOW_CAMERA_MODE,
          followLookAt: next.lookAt,
          cameraPosition: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
          },
        })
      }
    }
  })

  return null
}
