import { useLayoutEffect, useRef } from 'react'
import { Object3D, type InstancedMesh, type MeshStandardMaterial } from 'three'
import { MOURNEVEIL_PALETTE } from '../../../mourneveilPalette'
import type { WorldObjectPlacement } from '../../worldObjectTypes'
import { resolveWorldObjectDefinition } from '../../worldObjectRegistry'
import { resolvePlacementScale } from '../../worldObjectTypes'
import { registerOcclusionMaterial } from '../../../occlusionMaterials'

export function GateBarsVisual({ placement }: { readonly placement: WorldObjectPlacement }) {
  const meshRef = useRef<InstancedMesh>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)
  const isFinal = placement.objectId === 'ossuary.gate.final'
  const definition = resolveWorldObjectDefinition(placement.objectId)
  const scale = resolvePlacementScale(placement, definition)
  const bounds = definition.visualBounds ?? [0.5, 1.5, 1.8]
  const size: readonly [number, number, number] = [bounds[0] * scale[0], bounds[1] * scale[1], bounds[2] * scale[2]]
  const verticalCount = isFinal ? 7 : 5
  const instanceCount = verticalCount + 2

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (mesh === null) return
    const transform = new Object3D()
    const span = size[2] * 0.72
    for (let index = 0; index < verticalCount; index += 1) {
      const ratio = index / (verticalCount - 1) - 0.5
      transform.position.set(0, 0, ratio * span)
      transform.rotation.set(0, 0, 0)
      transform.scale.set(1, size[1] / 1.32, 1)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    }
    for (let rail = 0; rail < 2; rail += 1) {
      transform.position.set(0, rail === 0 ? -0.43 : 0.43, 0)
      transform.rotation.set(Math.PI / 2, 0, 0)
      transform.scale.set(1, span / 1.32, 1)
      transform.updateMatrix()
      mesh.setMatrixAt(verticalCount + rail, transform.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [size, verticalCount])

  useLayoutEffect(() => {
    const material = materialRef.current
    if (material === null) return
    return registerOcclusionMaterial({ id: placement.instanceId, material, baseOpacity: 1 })
  }, [placement.instanceId])

  return (
    <group position={placement.position} rotation={placement.rotation}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, instanceCount]}
        castShadow
        receiveShadow
        userData={{ solidId: placement.instanceId }}
      >
        <boxGeometry args={[0.16, 1.32, 0.12]} />
        <meshStandardMaterial
          ref={materialRef}
          color={isFinal ? MOURNEVEIL_PALETTE.finalGate.sealed : MOURNEVEIL_PALETTE.environment.iron}
          emissive={isFinal ? MOURNEVEIL_PALETTE.finalGate.emissive : MOURNEVEIL_PALETTE.shortcut.emissive}
          emissiveIntensity={isFinal ? 0.34 : 0.12}
          roughness={0.46}
          metalness={0.74}
          transparent
          opacity={1}
          depthWrite
        />
      </instancedMesh>
    </group>
  )
}
