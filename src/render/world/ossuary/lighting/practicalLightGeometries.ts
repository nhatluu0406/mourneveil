import {
  BoxGeometry,
  CylinderGeometry,
  AdditiveBlending,
  BackSide,
  MeshBasicMaterial,
  Object3D,
  OctahedronGeometry,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { getOssuaryMaterial } from '../materials'

function transformed(geometry: BufferGeometry, mutate: (node: Object3D) => void): BufferGeometry {
  const node = new Object3D()
  mutate(node)
  node.updateMatrix()
  const next = geometry.clone().applyMatrix4(node.matrix)
  geometry.dispose()
  return next
}

function mergeParts(parts: readonly BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries([...parts], false)
  if (merged === null) {
    throw new Error('Failed to merge practical-light fixture geometry')
  }
  for (const part of parts) part.dispose()
  return merged
}

/** Shared warm/cool flame materials — never clone per fixture. */
export const PRACTICAL_FLAME_WARM = getOssuaryMaterial('ember')
export const PRACTICAL_FLAME_VEIL = getOssuaryMaterial('veil')

export const PRACTICAL_GLOW_WARM = new MeshBasicMaterial({
  color: '#f1a15f',
  transparent: true,
  opacity: 0.18,
  side: BackSide,
  depthWrite: false,
  blending: AdditiveBlending,
})

export const PRACTICAL_GLOW_VEIL = new MeshBasicMaterial({
  color: '#8fe9df',
  transparent: true,
  opacity: 0.18,
  side: BackSide,
  depthWrite: false,
  blending: AdditiveBlending,
})

export const PRACTICAL_FLAME_GEO = new OctahedronGeometry(0.13, 1)
export const PRACTICAL_GLOW_GEO = new SphereGeometry(0.18, 8, 6)

const SCONCE_IRON = mergeParts([
  transformed(new BoxGeometry(0.26, 0.42, 0.1), (node) => {
    node.position.set(0, 0, -0.1)
  }),
  transformed(new CylinderGeometry(0.22, 0.13, 0.14, 9), (node) => {
    node.position.set(0, 0.08, 0.46)
  }),
])

const SCONCE_BRONZE = transformed(new CylinderGeometry(0.035, 0.055, 0.52, 7), (node) => {
  node.position.set(0, -0.08, 0.22)
  node.rotation.set(Math.PI / 2, 0, 0)
})

const BRAZIER_IRON = mergeParts([
  ...[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) =>
    transformed(new CylinderGeometry(0.035, 0.06, 0.72, 6), (node) => {
      node.position.set(Math.sin(angle) * 0.28, 0.35, Math.cos(angle) * 0.28)
      node.rotation.set(0.08 * Math.cos(angle), 0, -0.08 * Math.sin(angle))
    }),
  ),
  transformed(new TorusGeometry(0.42, 0.045, 6, 16), (node) => {
    node.position.set(0, 0.68, 0)
    node.rotation.set(Math.PI / 2, 0, 0)
  }),
])

const BRAZIER_BRONZE = transformed(new CylinderGeometry(0.46, 0.28, 0.22, 12, 1, true), (node) => {
  node.position.set(0, 0.74, 0)
})

const VEIL_LAMP_POLE = transformed(new CylinderGeometry(0.08, 0.13, 1.4, 7), (node) => {
  node.position.set(0, 0.7, 0)
})

const VEIL_LAMP_IRON = mergeParts(
  [0, Math.PI / 2].map((angle) =>
    transformed(new TorusGeometry(0.3, 0.032, 6, 16), (node) => {
      node.position.set(0, 1.38, 0)
      node.rotation.set(0, angle, 0)
    }),
  ),
)

const CANDLE_CLUSTER_BONE = mergeParts([
  transformed(new CylinderGeometry(0.035, 0.045, 0.38, 7), (node) => {
    node.position.set(-0.16, 0.19, 0.02)
  }),
  transformed(new CylinderGeometry(0.035, 0.045, 0.54, 7), (node) => {
    node.position.set(0, 0.27, -0.05)
  }),
  transformed(new CylinderGeometry(0.035, 0.045, 0.3, 7), (node) => {
    node.position.set(0.15, 0.15, 0.05)
  }),
])

const CANDLE_CLUSTER_FLAME = mergeParts([
  transformed(PRACTICAL_FLAME_GEO.clone(), (node) => {
    node.position.set(-0.16, 0.4, 0.02)
    node.scale.setScalar(0.34)
  }),
  transformed(PRACTICAL_FLAME_GEO.clone(), (node) => {
    node.position.set(0, 0.56, -0.05)
    node.scale.setScalar(0.34)
  }),
  transformed(PRACTICAL_FLAME_GEO.clone(), (node) => {
    node.position.set(0.15, 0.32, 0.05)
    node.scale.setScalar(0.34)
  }),
])

export const PRACTICAL_FIXTURE_GEOMETRIES = Object.freeze({
  sconceIron: SCONCE_IRON,
  sconceBronze: SCONCE_BRONZE,
  brazierIron: BRAZIER_IRON,
  brazierBronze: BRAZIER_BRONZE,
  veilLampPole: VEIL_LAMP_POLE,
  veilLampIron: VEIL_LAMP_IRON,
  candleClusterBone: CANDLE_CLUSTER_BONE,
  candleClusterFlame: CANDLE_CLUSTER_FLAME,
})
