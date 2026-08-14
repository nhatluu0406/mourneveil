import { resolveObjectCollision, type WorldObjectDefinition } from './worldObjectTypes'

export type WorldObjectPhysicality = 'hard-physical' | 'soft-dressing' | 'vfx'

/** Content intent used by audits; it never creates physics outside canonical compilation. */
export function classifyWorldObjectPhysicality(
  definition: WorldObjectDefinition,
): WorldObjectPhysicality {
  if (definition.family === 'vfx' || definition.anchorPolicy === 'vfx') return 'vfx'
  return resolveObjectCollision(definition).kind === 'none' ? 'soft-dressing' : 'hard-physical'
}
