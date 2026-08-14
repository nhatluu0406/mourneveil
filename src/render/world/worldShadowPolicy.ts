import type { WorldObjectDefinition } from './worldObjectTypes'

/** Static instanced architecture receives the hero light but does not enter its dynamic shadow map. */
export function castsDynamicWorldShadow(definition: WorldObjectDefinition): boolean {
  return definition.castShadow && definition.family === 'landmark'
}
