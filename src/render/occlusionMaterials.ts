import type { MeshStandardMaterial } from 'three'

export interface OcclusionMaterialRegistration {
  readonly id: string
  readonly material: MeshStandardMaterial
  readonly baseOpacity: number
}

const materials = new Map<string, OcclusionMaterialRegistration>()

export function registerOcclusionMaterial(entry: OcclusionMaterialRegistration): () => void {
  materials.set(entry.id, entry)
  return () => {
    const current = materials.get(entry.id)
    if (current?.material === entry.material) materials.delete(entry.id)
  }
}

export function forEachOcclusionMaterial(
  visit: (id: string, entry: OcclusionMaterialRegistration) => void,
): void {
  for (const [id, entry] of materials) visit(id, entry)
}
