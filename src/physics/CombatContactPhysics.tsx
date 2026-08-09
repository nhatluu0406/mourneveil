import { useRapier } from '@react-three/rapier'
import { useEffect, useMemo, type ReactNode } from 'react'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { createRapierCombatContactQuery } from './combatContactQuery'
import {
  CombatHurtboxRegistryContext,
  RapierCombatHurtboxRegistry,
} from './combatHurtboxRegistry'

export function CombatContactPhysics({
  children,
  runtime,
}: {
  readonly children: ReactNode
  readonly runtime: GameRuntime
}) {
  const { world, rapier } = useRapier()
  const registry = useMemo(() => new RapierCombatHurtboxRegistry(), [])

  useEffect(
    () =>
      runtime.attachCombatContactQuery(
        createRapierCombatContactQuery(world, rapier, () => registry.registrations()),
      ),
    [rapier, registry, runtime, world],
  )

  return (
    <CombatHurtboxRegistryContext.Provider value={registry}>
      {children}
    </CombatHurtboxRegistryContext.Provider>
  )
}
