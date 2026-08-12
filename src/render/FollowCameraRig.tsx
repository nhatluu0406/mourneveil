import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { publishCameraDiagnostic } from '../debug/cameraDiagnosticPublish'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import {
  FOLLOW_CAMERA_MODE,
  createInitialFollowCameraState,
  stepFollowCamera,
  type CameraDiagnostic,
  type FollowCameraState,
} from './followCamera'
import { resolvePlayerOutgoingHitConfirm } from './playerCombatFeedback'

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
  const stateRef = useRef<FollowCameraState | null>(null)
  const diagnosticFrameRef = useRef(0)
  const lastHitKeyRef = useRef<string | null>(null)
  const impulseRemainingRef = useRef(0)
  const impulseScaleRef = useRef(1)

  useFrame((_, deltaSeconds) => {
    const snapshot = runtime.snapshot()
    const playerPosition = snapshot.player.position
    const facing = snapshot.player.facing
    const previous =
      stateRef.current ?? createInitialFollowCameraState(playerPosition, facing)
    const next = stepFollowCamera(previous, playerPosition, deltaSeconds, facing)
    stateRef.current = next

    const outgoing = resolvePlayerOutgoingHitConfirm({
      lastHit: snapshot.contact.lastHit,
      enemies: snapshot.enemies,
      simulationStep: snapshot.simulation.stepCount,
    })
    if (
      outgoing.kind !== 'none' &&
      outgoing.confirmKey !== null &&
      outgoing.confirmKey !== lastHitKeyRef.current
    ) {
      lastHitKeyRef.current = outgoing.confirmKey
      impulseScaleRef.current = outgoing.cameraImpulseScale
      impulseRemainingRef.current = HIT_IMPULSE_SECONDS
    }

    const lastIncoming = snapshot.incomingContact.lastHit
    if (
      lastIncoming !== null &&
      (lastIncoming.outcome === 'damaged' ||
        lastIncoming.outcome === 'guarded' ||
        lastIncoming.outcome === 'guard-broken')
    ) {
      const hitKey = `in:${lastIncoming.executionId}:${lastIncoming.simulationStep}:${lastIncoming.outcome}`
      if (hitKey !== lastHitKeyRef.current) {
        lastHitKeyRef.current = hitKey
        impulseScaleRef.current =
          lastIncoming.outcome === 'damaged'
            ? 1.35
            : lastIncoming.outcome === 'guard-broken'
              ? 1.2
              : 0.75
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
          HIT_IMPULSE_DISTANCE *
          impulseScaleRef.current
        : 0

    const cameraPosition = {
      x: next.pose.position.x + impulseStrength * 0.35,
      y: next.pose.position.y + impulseStrength * 0.2,
      z: next.pose.position.z + impulseStrength * 0.35,
    }
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    camera.lookAt(next.pose.lookAt.x, next.pose.lookAt.y, next.pose.lookAt.z)
    camera.updateMatrixWorld(true)

    const diagnostic: CameraDiagnostic = {
      mode: FOLLOW_CAMERA_MODE,
      followLookAt: next.pose.lookAt,
      lookAheadDir: next.lookAheadDir,
      cameraPosition,
    }
    publishCameraDiagnostic(diagnostic)

    if (onDiagnostic) {
      diagnosticFrameRef.current += 1
      if (diagnosticFrameRef.current % 12 === 0) {
        onDiagnostic(diagnostic)
      }
    }
  })

  return null
}
