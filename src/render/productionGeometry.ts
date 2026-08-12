import { BufferGeometry, Float32BufferAttribute } from 'three'

export interface TaperedPrismDimensions {
  readonly bottomWidth: number
  readonly topWidth: number
  readonly height: number
  readonly depth: number
}

/** Project-authored hard-surface form. Local origin is centered; Y is up. */
export function createTaperedPrismGeometry({
  bottomWidth,
  topWidth,
  height,
  depth,
}: TaperedPrismDimensions): BufferGeometry {
  const bottom = bottomWidth / 2
  const top = topWidth / 2
  const y0 = -height / 2
  const y1 = height / 2
  const z = depth / 2
  const vertices = [
    -bottom, y0, -z, bottom, y0, -z, bottom, y0, z, -bottom, y0, z,
    -top, y1, -z, top, y1, -z, top, y1, z, -top, y1, z,
  ]
  const indices = [
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7,
  ]
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  return geometry
}

/** Extrudes an authored X/Z silhouette across local Y thickness. */
export function createProfilePrismGeometry(
  profile: readonly (readonly [number, number])[],
  thickness: number,
): BufferGeometry {
  if (profile.length < 3) throw new Error('profile requires at least three points')
  const half = thickness / 2
  const vertices: number[] = []
  for (const y of [-half, half]) {
    for (const [x, z] of profile) vertices.push(x, y, z)
  }
  const count = profile.length
  const indices: number[] = []
  for (let index = 1; index < count - 1; index += 1) {
    indices.push(0, index + 1, index)
    indices.push(count, count + index, count + index + 1)
  }
  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count
    indices.push(index, next, count + next, index, count + next, count + index)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  return geometry
}

export function createOathbladeGeometry(): BufferGeometry {
  return createProfilePrismGeometry(
    [
      [-0.055, 0.05],
      [-0.075, -0.28],
      [-0.035, -0.52],
      [0, -0.62],
      [0.035, -0.52],
      [0.075, -0.28],
      [0.055, 0.05],
    ],
    0.035,
  )
}

/** Broad, short grave-iron silhouette. Render reach remains unrelated to combat reach. */
export function createGravebrandGeometry(): BufferGeometry {
  return createProfilePrismGeometry(
    [[-0.12, 0.04], [-0.16, -0.22], [-0.13, -0.48], [0, -0.58], [0.13, -0.48], [0.16, -0.22], [0.12, 0.04]],
    0.065,
  )
}

/** Slender hooked veil blade with an asymmetric thorn tip. */
export function createVeilThornGeometry(): BufferGeometry {
  return createProfilePrismGeometry(
    [[-0.038, 0.04], [-0.055, -0.3], [-0.025, -0.58], [0.035, -0.7], [0.085, -0.54], [0.045, -0.32], [0.052, 0.04]],
    0.026,
  )
}
