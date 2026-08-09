import type { RapierCollider } from '@react-three/rapier'
import { createContext, useContext, useEffect, type RefObject } from 'react'
import type { CombatHurtboxId } from '../game/combat/combatTarget'
import type { RapierHurtboxRegistration } from './combatContactQuery'

export class RapierCombatHurtboxRegistry {
  private readonly colliders = new Map<CombatHurtboxId, RapierCollider>()

  register(hurtboxId: CombatHurtboxId, collider: RapierCollider): () => void {
    this.colliders.set(hurtboxId, collider)
    return () => {
      if (this.colliders.get(hurtboxId) === collider) this.colliders.delete(hurtboxId)
    }
  }

  registrations(): readonly RapierHurtboxRegistration[] {
    return [...this.colliders].map(([hurtboxId, collider]) => ({ hurtboxId, collider }))
  }
}

export const CombatHurtboxRegistryContext =
  createContext<RapierCombatHurtboxRegistry | null>(null)

export function useCombatHurtboxRegistration(
  hurtboxId: CombatHurtboxId,
  colliderRef: RefObject<RapierCollider | null>,
): void {
  const registry = useContext(CombatHurtboxRegistryContext)
  if (registry === null) throw new Error('Combat hurtbox must be inside CombatContactPhysics')

  useEffect(() => {
    const collider = colliderRef.current
    return collider === null ? undefined : registry.register(hurtboxId, collider)
  }, [colliderRef, hurtboxId, registry])
}
