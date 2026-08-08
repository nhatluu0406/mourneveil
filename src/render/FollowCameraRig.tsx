import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import type { PlayerRuntime } from '../game/character/playerRuntime'
import {
  FOLLOW_CAMERA_MODE,
  FOLLOW_DAMPING,
  createInitialFollowCameraPose,
  stepFollowCamera,
  type CameraDiagnostic,
  type FollowCameraPose,
} from './followCamera'

interface FollowCameraRigProps {
  runtime: PlayerRuntime
  onDiagnostic?: (diagnostic: CameraDiagnostic) => void
}

/** Presentation-only R3F camera driver. Does not write into simulation. */
export function FollowCameraRig({
  runtime,
  onDiagnostic,
}: FollowCameraRigProps) {
  const { camera } = useThree()
  const poseRef = useRef<FollowCameraPose | null>(null)
  const diagnosticFrameRef = useRef(0)

  useFrame((_, deltaSeconds) => {
    const playerPosition = runtime.snapshot().player.position
    const previous =
      poseRef.current ?? createInitialFollowCameraPose(playerPosition)
    const next = stepFollowCamera(
      previous,
      playerPosition,
      deltaSeconds,
      FOLLOW_DAMPING,
    )
    poseRef.current = next

    camera.position.set(next.position.x, next.position.y, next.position.z)
    camera.lookAt(next.lookAt.x, next.lookAt.y, next.lookAt.z)

    if (onDiagnostic) {
      diagnosticFrameRef.current += 1
      // Throttle React diagnostic updates; camera itself updates every frame.
      if (diagnosticFrameRef.current % 6 === 0) {
        onDiagnostic({
          mode: FOLLOW_CAMERA_MODE,
          followLookAt: next.lookAt,
          cameraPosition: next.position,
        })
      }
    }
  })

  return null
}
