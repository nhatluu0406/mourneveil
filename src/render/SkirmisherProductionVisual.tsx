import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AnimationMixer, type Group, type Mesh, type Object3D } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { SKIRMISHER_PROOF_ASSET } from '../content/assets/productionAssetReference'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { meleeRoleByDefinitionId } from '../game/enemies/enemyRoles'
import {
  createEnemyAttackPresentationSnapshot,
  localNegativeZFacingYaw,
} from './enemyAttackPresentation'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'
import { projectEnemyAnimation } from './animation/enemyAnimationProjection'
import {
  syncEnemyGltfClipPlayback,
  type EnemyGltfClipPlaybackState,
} from './animation/enemyGltfClipPlayback'
import { combatContactCueLayout } from './combatContactCueLayout'
import { CombatContactVolumeCue } from './CombatContactVolumeCue'

function enableShadows(root: Object3D): void {
  root.traverse((node) => {
    if ('isMesh' in node && node.isMesh === true) {
      node.castShadow = true
      node.receiveShadow = true
    }
  })
}

export function SkirmisherProductionVisual({
  runtime,
  enemyId,
}: {
  readonly runtime: GameRuntime
  readonly enemyId: string
}) {
  const facingRef = useRef<Group>(null)
  const modelRef = useRef<Group>(null)
  const telegraphRef = useRef<Mesh>(null)
  const contactRef = useRef<Group>(null)
  const playbackRef = useRef<EnemyGltfClipPlaybackState>({ mode: null, action: null })
  const { scene, animations } = useGLTF(SKIRMISHER_PROOF_ASSET.runtimeUrl)
  const skinnedRoot = useMemo(() => {
    // One component instance mounts per enemyId (parent key), so a scene-keyed clone stays instance-local.
    const cloned = cloneSkinned(scene)
    enableShadows(cloned)
    return cloned
  }, [scene])
  const mixer = useMemo(() => new AnimationMixer(skinnedRoot), [skinnedRoot])

  useEffect(() => {
    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(skinnedRoot)
    }
  }, [mixer, skinnedRoot])

  useFrame((_state, deltaSeconds) => {
    const runtimeSnapshot = runtime.snapshot()
    const enemyIndex = runtimeSnapshot.enemies.findIndex((entry) => entry.id === enemyId)
    if (enemyIndex < 0) return
    const enemy = runtimeSnapshot.enemies[enemyIndex]
    const role = meleeRoleByDefinitionId(enemy.definitionId)
    if (role === null || role.role !== 'skirmisher') return
    const enemyAttack = runtimeSnapshot.enemyAttacks[enemyIndex]
    const attackPresentation = createEnemyAttackPresentationSnapshot(enemy, enemyAttack)
    const animation = projectEnemyAnimation(
      enemy,
      runtimeSnapshot.simulation.stepCount,
      runtimeSnapshot.contact,
    )
    const facing = facingRef.current
    const model = modelRef.current
    const telegraph = telegraphRef.current
    const contact = contactRef.current
    if (facing === null || model === null || telegraph === null || contact === null) return

    facing.rotation.y = localNegativeZFacingYaw(animation.facing)
    model.scale.set(
      SKIRMISHER_PROOF_ASSET.scale[0],
      SKIRMISHER_PROOF_ASSET.scale[1],
      SKIRMISHER_PROOF_ASSET.scale[2],
    )
    model.rotation.set(
      SKIRMISHER_PROOF_ASSET.rotationRadians[0],
      SKIRMISHER_PROOF_ASSET.rotationRadians[1],
      SKIRMISHER_PROOF_ASSET.rotationRadians[2],
    )
    // Ground-centered GLB parented to capsule center: drop by full capsule extent.
    model.position.y = -(role.definition.body.halfHeight + role.definition.body.radius)

    playbackRef.current = syncEnemyGltfClipPlayback({
      mixer,
      clips: animations,
      mapping: SKIRMISHER_PROOF_ASSET.animationSemantics,
      mode: animation.mode,
      blendSeconds: animation.transition.blendSeconds,
      previous: playbackRef.current,
    })
    mixer.update(deltaSeconds)

    telegraph.visible = attackPresentation.telegraphVisible
    contact.visible = import.meta.env.DEV && attackPresentation.contactVisible
    if (attackPresentation.contactVisible) {
      const cue = combatContactCueLayout(role.contact.forwardOffset, role.contact.radius)
      contact.position.set(0, cue.localY, -cue.forwardOffset)
      contact.scale.setScalar(cue.radius)
    }
  })

  const enemy =
    runtime.snapshot().enemies.find((entry) => entry.id === enemyId) ?? null
  const role = enemy === null ? null : meleeRoleByDefinitionId(enemy.definitionId)
  if (role === null || role.role !== 'skirmisher') return null

  return (
    <group ref={facingRef} userData={{ productionAssetId: SKIRMISHER_PROOF_ASSET.id }}>
      <group ref={modelRef}>
        <primitive object={skinnedRoot} />
      </group>
      <mesh
        ref={telegraphRef}
        position={[0, -0.78, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry args={[0.35, 0.78, 28, 1, Math.PI * 0.15, Math.PI * 0.55]} />
        <meshBasicMaterial
          color={MOURNEVEIL_PALETTE.skirmisher.telegraph}
          transparent
          opacity={0.72}
          side={2}
        />
      </mesh>
      <CombatContactVolumeCue
        groupRef={contactRef}
        color={MOURNEVEIL_PALETTE.skirmisher.contact}
        opacity={0.3}
      />
    </group>
  )
}
