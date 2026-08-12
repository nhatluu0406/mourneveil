import { Matrix4, type InstancedMesh, type Object3D } from 'three'

export interface InstanceMatrixProbeEntry {
  readonly name: string
  readonly count: number
  readonly visible: boolean
  readonly materialDisposed: boolean | null
  readonly sampleY: readonly number[]
  readonly sampleX: readonly number[]
  readonly sampleZ: readonly number[]
}

let lastProbe: readonly InstanceMatrixProbeEntry[] = []
const scratchMatrix = new Matrix4()

/** DEV: sample instance translation from named world-object InstancedMeshes. */
export function publishInstanceMatrixProbe(root: Object3D): void {
  const entries: InstanceMatrixProbeEntry[] = []
  root.traverse((object) => {
    const mesh = object as InstancedMesh
    if (mesh.isInstancedMesh !== true) return
    if (!String(mesh.name ?? '').startsWith('world-object.')) return
    const sampleY: number[] = []
    const sampleX: number[] = []
    const sampleZ: number[] = []
    const limit = Math.min(mesh.count, 24)
    for (let index = 0; index < limit; index += 1) {
      mesh.getMatrixAt(index, scratchMatrix)
      sampleX.push(Number(scratchMatrix.elements[12]!.toFixed(2)))
      sampleY.push(Number(scratchMatrix.elements[13]!.toFixed(2)))
      sampleZ.push(Number(scratchMatrix.elements[14]!.toFixed(2)))
    }
    const material = mesh.material as { disposed?: boolean } | Array<{ disposed?: boolean }>
    const materialDisposed = Array.isArray(material)
      ? material.some((entry) => entry.disposed === true)
      : (material?.disposed ?? null)
    entries.push({
      name: mesh.name,
      count: mesh.count,
      visible: mesh.visible,
      materialDisposed,
      sampleX,
      sampleY,
      sampleZ,
    })
  })
  lastProbe = entries
}

export function readInstanceMatrixProbe(): readonly InstanceMatrixProbeEntry[] {
  return lastProbe
}
