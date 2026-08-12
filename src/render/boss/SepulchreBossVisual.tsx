import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type Group, type Mesh } from 'three'
import type { GameRuntime } from '../../game/runtime/GameRuntime'
import { projectEnemyAnimation } from '../animation/enemyAnimationProjection'
import { createEnemyAttackPresentationSnapshot, localNegativeZFacingYaw } from '../enemyAttackPresentation'
import { SepulchreBody } from './SepulchreBody'
import { SepulchreCrushCue, SepulchreDefeatCue, SepulchreLungeCue, SepulchrePhaseCue, SepulchreSlamCue, SepulchreSlashCue } from './SepulchreBossVfx'
import { SepulchreWeapon } from './SepulchreWeapon'
import { resolveSepulchrePresentation } from './sepulchrePresentation'

export function SepulchreBossVisual({ runtime, enemyId }: { readonly runtime: GameRuntime; readonly enemyId: string }) {
  const facingRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const weaponRef = useRef<Group>(null)
  const leftPlateRef = useRef<Group>(null)
  const rightPlateRef = useRef<Group>(null)
  const coreRef = useRef<Mesh>(null)
  const slashRef = useRef<Group>(null)
  const crushRef = useRef<Group>(null)
  const lungeRef = useRef<Group>(null)
  const slamRef = useRef<Group>(null)
  const phaseRef = useRef<Group>(null)
  const defeatRef = useRef<Group>(null)
  const phaseTwoSeen = useRef(false)
  const phasePulse = useRef(0)
  const defeatSeen = useRef(false)
  const defeatPulse = useRef(0)

  useFrame((_state, delta) => {
    const snapshot = runtime.snapshot()
    const enemyIndex = snapshot.enemies.findIndex((enemy) => enemy.id === enemyId)
    if (enemyIndex < 0) return
    const enemy = snapshot.enemies[enemyIndex]!
    const attack = snapshot.enemyAttacks[enemyIndex]!
    const attackPresentation = createEnemyAttackPresentationSnapshot(enemy, attack)
    const animation = projectEnemyAnimation(enemy, snapshot.simulation.stepCount, snapshot.contact)
    const presentation = resolveSepulchrePresentation({
      alive: enemy.alive,
      healthCurrent: enemy.health.current,
      healthMaximum: enemy.health.maximum,
      actionId: enemy.action.actionId,
      phase: enemy.action.phase,
      phaseProgress: attackPresentation.phaseProgress,
      hitReacting: animation.hitReactionToken !== null,
    })
    const facing = facingRef.current
    const body = bodyRef.current
    const weapon = weaponRef.current
    const left = leftPlateRef.current
    const right = rightPlateRef.current
    const core = coreRef.current
    if (facing === null || body === null || weapon === null || left === null || right === null || core === null) return
    facing.rotation.y = localNegativeZFacingYaw(attackPresentation.facing)
    body.rotation.x = MathUtils.damp(body.rotation.x, presentation.bodyPitch, 10, delta)
    body.rotation.z = MathUtils.damp(body.rotation.z, presentation.defeated ? 0.32 : 0, 7, delta)
    body.position.z = MathUtils.damp(body.position.z, presentation.bodyOffsetZ, 12, delta)
    body.position.y = MathUtils.damp(body.position.y, presentation.defeated ? -0.34 : 0.18, 7, delta)
    weapon.rotation.x = MathUtils.damp(weapon.rotation.x, presentation.weaponPitch, 13, delta)
    weapon.rotation.y = MathUtils.damp(weapon.rotation.y, presentation.weaponYaw, 13, delta)
    weapon.rotation.z = MathUtils.damp(weapon.rotation.z, presentation.weaponRoll, 13, delta)
    left.rotation.y = MathUtils.damp(left.rotation.y, presentation.coreExposure * -0.72, 7, delta)
    right.rotation.y = MathUtils.damp(right.rotation.y, presentation.coreExposure * 0.72, 7, delta)
    left.position.x = MathUtils.damp(left.position.x, -0.25 - presentation.coreExposure * 0.18, 7, delta)
    right.position.x = MathUtils.damp(right.position.x, 0.25 + presentation.coreExposure * 0.18, 7, delta)
    core.scale.setScalar(MathUtils.damp(core.scale.x, 0.35 + presentation.coreExposure * 0.9, 9, delta))
    core.rotation.y += delta * (presentation.phaseTwo ? 2.3 : 0.7)

    const cueVisible = presentation.committed && enemy.action.phase === 'startup'
    slashRef.current!.visible = cueVisible && presentation.attack === 'slash'
    crushRef.current!.visible = cueVisible && presentation.attack === 'crush'
    lungeRef.current!.visible = cueVisible && presentation.attack === 'lunge'
    slamRef.current!.visible = cueVisible && presentation.attack === 'slam'
    const cueScale = 0.84 + attackPresentation.phaseProgress * 0.18
    for (const cue of [slashRef.current, crushRef.current, lungeRef.current, slamRef.current]) cue?.scale.setScalar(cueScale)

    if (presentation.phaseTwo && !phaseTwoSeen.current) {
      phaseTwoSeen.current = true
      phasePulse.current = 1
    }
    phasePulse.current = Math.max(0, phasePulse.current - delta / 2.2)
    if (phaseRef.current !== null) {
      phaseRef.current.visible = phasePulse.current > 0
      phaseRef.current.rotation.y += delta * 0.8
      phaseRef.current.scale.setScalar(0.75 + (1 - phasePulse.current) * 1.45)
    }
    if (presentation.defeated && !defeatSeen.current) {
      defeatSeen.current = true
      defeatPulse.current = 1
    }
    defeatPulse.current = Math.max(0, defeatPulse.current - delta / 2.4)
    if (defeatRef.current !== null) {
      defeatRef.current.visible = defeatPulse.current > 0
      defeatRef.current.rotation.y += delta * 0.25
      defeatRef.current.scale.setScalar(0.8 + (1 - defeatPulse.current) * 1.6)
    }
  })

  return (
    <group ref={facingRef} userData={{ productionAssetId: 'enemy.boss.veilbound-sepulchre', bossPresentation: 'production-candidate' }}>
      <SepulchreBody ref={bodyRef} leftPlateRef={leftPlateRef} rightPlateRef={rightPlateRef} coreRef={coreRef} />
      <SepulchreWeapon ref={weaponRef} />
      <SepulchreSlashCue ref={slashRef} />
      <SepulchreCrushCue ref={crushRef} />
      <SepulchreLungeCue ref={lungeRef} />
      <SepulchreSlamCue ref={slamRef} />
      <SepulchrePhaseCue ref={phaseRef} />
      <SepulchreDefeatCue ref={defeatRef} />
    </group>
  )
}
