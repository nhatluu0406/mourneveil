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
  group.position.set(event.contactPosition.x, event.contactPosition.y + 0.08, event.contactPosition.z)
  group.scale.setScalar(0.5 + cue.progress * 1.35)
  group.rotation.y = cue.progress * 1.4
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
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.035, 6, 24, Math.PI * 1.55]} />
          <meshBasicMaterial ref={outgoingMaterial} transparent depthWrite={false} />
        </mesh>
        {[0, 1, 2].map((index) => (
          <mesh key={index} position={[Math.cos(index * 2.1) * 0.28, 0.12 + index * 0.05, Math.sin(index * 2.1) * 0.28]} rotation={[0, index * 2.1, 0]}>
            <coneGeometry args={[0.045, 0.26, 4]} />
            <meshBasicMaterial color="#f2d18d" transparent opacity={0.72} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <group ref={incomingGroup} visible={false} userData={{ effect: 'veil-defense-impact' }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.36, 24]} />
          <meshBasicMaterial ref={incomingMaterial} transparent depthWrite={false} side={2} />
        </mesh>
      </group>
    </>
  )
}
