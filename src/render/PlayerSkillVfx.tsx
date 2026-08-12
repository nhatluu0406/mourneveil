import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { AdditiveBlending, MathUtils, MeshBasicMaterial, OctahedronGeometry, PlaneGeometry, type Group } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { projectPlayerAnimation } from './animation/playerAnimationProjection'
import { resolvePlayerSkillPresentation } from './playerSkillPresentation'

const SKILL_STREAK = new PlaneGeometry(0.16, 1)
const SKILL_FACET = new OctahedronGeometry(0.24, 0)
const VEIL_MATERIAL = new MeshBasicMaterial({ color: '#65c9c8', transparent: true, opacity: 0.65, depthWrite: false, side: 2, blending: AdditiveBlending })
const VEIL_CORE_MATERIAL = new MeshBasicMaterial({ color: '#d5f8f1', transparent: true, opacity: 0.78, depthWrite: false, side: 2, blending: AdditiveBlending })
const OATH_MATERIAL = new MeshBasicMaterial({ color: '#c98235', transparent: true, opacity: 0.72, depthWrite: false, side: 2, blending: AdditiveBlending })
const OATH_CORE_MATERIAL = new MeshBasicMaterial({ color: '#f1d08a', transparent: true, opacity: 0.82, depthWrite: false, side: 2, blending: AdditiveBlending })
const WARD_MATERIAL = new MeshBasicMaterial({ color: '#9fd5c8', transparent: true, opacity: 0.56, depthWrite: false, blending: AdditiveBlending })

export function PlayerSkillVfx({ runtime }: { readonly runtime: GameRuntime }) {
  const fractureRef = useRef<Group>(null)
  const cleaveRef = useRef<Group>(null)
  const wardRef = useRef<Group>(null)

  useFrame(() => {
    const snapshot = runtime.snapshot()
    const animation = projectPlayerAnimation(snapshot)
    const cue = resolvePlayerSkillPresentation({
      actionId: animation.action?.actionId ?? null,
      phase: animation.action?.phase ?? 'idle',
      normalizedPhaseProgress: animation.action?.normalizedPhaseProgress ?? 0,
    })
    const fracture = fractureRef.current
    const cleave = cleaveRef.current
    const ward = wardRef.current
    if (fracture === null || cleave === null || ward === null) return

    fracture.visible = cue.motif === 'veil-fracture'
    cleave.visible = cue.motif === 'oath-arc'
    ward.visible = cue.motif === 'ward-facets'
    if (!cue.visible) return

    if (fracture.visible) {
      fracture.position.z = 0.38 + cue.progress * 0.45
      fracture.scale.set(0.72 + cue.intensity * 0.35, 0.82 + cue.intensity * 0.32, 1)
      VEIL_MATERIAL.opacity = 0.18 + cue.intensity * 0.62
      VEIL_CORE_MATERIAL.opacity = 0.25 + cue.intensity * 0.67
    }
    if (cleave.visible) {
      cleave.rotation.y = -0.8 + cue.progress * 1.65
      cleave.scale.setScalar(0.72 + cue.intensity * 0.42)
      OATH_MATERIAL.opacity = 0.2 + cue.intensity * 0.7
      OATH_CORE_MATERIAL.opacity = 0.28 + cue.intensity * 0.7
    }
    if (ward.visible) {
      ward.rotation.y = cue.progress * 0.42
      ward.scale.setScalar(0.82 + cue.intensity * 0.2)
      WARD_MATERIAL.opacity = MathUtils.clamp(0.2 + cue.intensity * 0.62, 0, 0.82)
    }
  })

  return (
    <group userData={{ presentation: 'player-active-skill-vfx', authority: 'projection-only' }}>
      <group ref={fractureRef} visible={false} position={[0, 0.05, 0.38]}>
        {[-0.32, -0.08, 0.2].map((x, index) => (
          <mesh key={x} geometry={SKILL_FACET} material={index === 1 ? VEIL_CORE_MATERIAL : VEIL_MATERIAL} position={[x, 0.14 + index * 0.16, index * 0.18]} rotation={[0.2, 0.2 + index * 0.5, -0.42 + index * 0.31]} scale={[0.42, 1.8 - index * 0.22, 0.3]}>
          </mesh>
        ))}
      </group>
      <group ref={cleaveRef} visible={false} position={[0, 0.12, -0.32]}>
        {[-0.26, 0, 0.26].map((x, index) => (
          <mesh key={x} geometry={SKILL_STREAK} material={index === 1 ? OATH_CORE_MATERIAL : OATH_MATERIAL} position={[x, 0.14 + index * 0.08, -0.42 - index * 0.12]} rotation={[0.25, -0.3 + index * 0.3, -0.72]} scale={[1.12, 1.5 - index * 0.14, 1]}>
          </mesh>
        ))}
      </group>
      <group ref={wardRef} visible={false} position={[0, 0.03, 0]}>
        {[-0.34, 0.34].flatMap((x) => [-0.25, 0.18].map((z, index) => (
          <mesh key={`${x}:${z}`} geometry={SKILL_FACET} material={WARD_MATERIAL} position={[x, 0.2 + index * 0.18, z]} rotation={[0, x < 0 ? -0.22 : 0.22, x < 0 ? 0.15 : -0.15]} scale={index === 0 ? 1.15 : 0.9}>
          </mesh>
        )))}
        <mesh geometry={SKILL_FACET} material={WARD_MATERIAL} position={[0, 0.38, -0.42]} scale={[1.5, 2.05, 0.28]} />
      </group>
    </group>
  )
}
