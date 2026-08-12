import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { MathUtils, type Group, type MeshBasicMaterial } from 'three'
import type { CombatHitEvent } from '../game/combat/combatContact'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { resolveCombatVfxPresentation } from './combatVfxPresentation'

interface CueRefs {
  readonly group: RefObject<Group | null>
  readonly material: RefObject<MeshBasicMaterial | null>
}

function updateCue(
  event: CombatHitEvent | null,
  simulationStep: number,
  refs: CueRefs,
): void {
  const group = refs.group.current
  const material = refs.material.current
  if (group === null || material === null) return
  const cue = resolveCombatVfxPresentation(event, simulationStep)
  group.visible = cue.visible
  if (!cue.visible || event === null) return
  group.position.set(event.contactPosition.x, event.contactPosition.y + 0.14, event.contactPosition.z)
  group.scale.setScalar(0.52 + cue.progress * 1.18)
  group.rotation.y = cue.progress * 1.9
  material.color.set(cue.color)
  material.opacity = MathUtils.clamp((1 - cue.progress) * cue.intensity, 0, 1)
}

export function VeilCombatVfx({ runtime }: { readonly runtime: GameRuntime }) {
  const outgoingGroup = useRef<Group>(null)
  const outgoingMaterial = useRef<MeshBasicMaterial>(null)
  const incomingGroup = useRef<Group>(null)
  const incomingMaterial = useRef<MeshBasicMaterial>(null)

  useFrame(() => {
    const snapshot = runtime.snapshot()
    updateCue(snapshot.contact.lastHit, snapshot.simulation.stepCount, {
      group: outgoingGroup,
      material: outgoingMaterial,
    })
    updateCue(snapshot.incomingContact.lastHit, snapshot.simulation.stepCount, {
      group: incomingGroup,
      material: incomingMaterial,
    })
  })

  return (
    <>
      <group ref={outgoingGroup} visible={false} userData={{ effect: 'veil-outgoing-hit' }}>
        <mesh rotation={[-Math.PI / 2, 0, -0.45]}>
          <torusGeometry args={[0.3, 0.026, 5, 28, Math.PI * 1.12]} />
          <meshBasicMaterial ref={outgoingMaterial} transparent depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI * 0.72]} scale={[0.72, 0.72, 0.72]}>
          <torusGeometry args={[0.32, 0.018, 5, 24, Math.PI * 0.78]} />
          <meshBasicMaterial color="#86dedb" transparent opacity={0.52} depthWrite={false} />
        </mesh>
        {[0, 1, 2, 3].map((index) => (
          <mesh
            key={index}
            position={[
              Math.cos(index * 1.63 + 0.35) * 0.31,
              0.09 + (index % 2) * 0.08,
              Math.sin(index * 1.63 + 0.35) * 0.31,
            ]}
            rotation={[0.2, index * 1.63, index % 2 === 0 ? 0.25 : -0.22]}
          >
            <coneGeometry args={[0.035, 0.2 + index * 0.018, 4]} />
            <meshBasicMaterial color={index < 2 ? '#e6bd73' : '#8ce0d8'} transparent opacity={0.66} depthWrite={false} />
          </mesh>
        ))}
      </group>

      <group ref={incomingGroup} visible={false} userData={{ effect: 'veil-defense-impact' }}>
        <mesh rotation={[-Math.PI / 2, 0, -0.25]}>
          <torusGeometry args={[0.28, 0.032, 6, 28, Math.PI * 1.45]} />
          <meshBasicMaterial ref={incomingMaterial} transparent depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, Math.PI * 0.5]} scale={[0.72, 0.72, 0.72]}>
          <ringGeometry args={[0.22, 0.27, 20, 1, 0, Math.PI * 1.25]} />
          <meshBasicMaterial color="#9ad9dc" transparent opacity={0.34} depthWrite={false} side={2} />
        </mesh>
      </group>
    </>
  )
}
