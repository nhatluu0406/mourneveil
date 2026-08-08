import type Rapier from '@dimforge/rapier3d-compat'
import type { Collider, World } from '@dimforge/rapier3d-compat'
import type {
  CombatContactCandidate,
  CombatContactQuery,
} from '../game/combat/combatContact'
import type { CombatHurtboxId } from '../game/combat/trainingTarget'

export interface RapierHurtboxRegistration {
  readonly hurtboxId: CombatHurtboxId
  readonly collider: Collider
}

export function createRapierCombatContactQuery(
  world: World,
  rapier: typeof Rapier,
  registrations: readonly RapierHurtboxRegistration[],
): CombatContactQuery {
  const hurtboxIdByCollider = new Map(
    registrations.map(
      (registration) =>
        [registration.collider.handle, registration.hurtboxId] as const,
    ),
  )

  return ({ contactShape, hurtboxes }) => {
    const requestedHurtboxes = new Map(
      hurtboxes.map((hurtbox) => [hurtbox.id, hurtbox.ownerId] as const),
    )
    const candidates: CombatContactCandidate[] = []
    const seenHurtboxes = new Set<CombatHurtboxId>()

    world.intersectionsWithShape(
      contactShape.center,
      { x: 0, y: 0, z: 0, w: 1 },
      new rapier.Ball(contactShape.radius),
      (collider) => {
        const hurtboxId = hurtboxIdByCollider.get(collider.handle)
        const targetId =
          hurtboxId === undefined
            ? undefined
            : requestedHurtboxes.get(hurtboxId)
        if (
          hurtboxId !== undefined &&
          targetId !== undefined &&
          !seenHurtboxes.has(hurtboxId)
        ) {
          seenHurtboxes.add(hurtboxId)
          candidates.push({ hurtboxId, targetId })
        }
        return true
      },
    )

    return candidates
  }
}
