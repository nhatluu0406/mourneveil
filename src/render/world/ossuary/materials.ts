import { MeshStandardMaterial } from 'three'
import { MOURNEVEIL_PALETTE } from '../../mourneveilPalette'
import type { OssuaryMaterialKey } from '../worldObjectTypes'

/**
 * Shared ossuary material presets. One instance per key — placements must not clone.
 * Tuned for dark-fantasy mood with readable value separation.
 */
export const OSSUARY_MATERIALS: Readonly<Record<OssuaryMaterialKey, MeshStandardMaterial>> =
  Object.freeze({
    darkStone: new MeshStandardMaterial({
      color: MOURNEVEIL_PALETTE.environment.masonry,
      roughness: 0.86,
      metalness: 0.04,
      flatShading: true,
    }),
    recessStone: new MeshStandardMaterial({
      color: MOURNEVEIL_PALETTE.environment.recess,
      roughness: 0.96,
      metalness: 0,
      flatShading: true,
    }),
    floorSlab: new MeshStandardMaterial({
      color: MOURNEVEIL_PALETTE.environment.floorSlab,
      roughness: 0.9,
      metalness: 0.02,
      flatShading: true,
    }),
    sealStone: new MeshStandardMaterial({
      color: '#353d40',
      roughness: 0.82,
      metalness: 0.06,
      flatShading: true,
    }),
    ashStone: new MeshStandardMaterial({
      color: MOURNEVEIL_PALETTE.environment.ashStone,
      roughness: 0.98,
      metalness: 0,
      flatShading: true,
    }),
    bone: new MeshStandardMaterial({
      color: MOURNEVEIL_PALETTE.environment.bone,
      roughness: 0.72,
      metalness: 0.02,
      flatShading: true,
    }),
    bronze: new MeshStandardMaterial({
      color: MOURNEVEIL_PALETTE.environment.bronze,
      roughness: 0.46,
      metalness: 0.64,
    }),
    verdigris: new MeshStandardMaterial({
      color: MOURNEVEIL_PALETTE.environment.verdigris,
      roughness: 0.42,
      metalness: 0.58,
    }),
    iron: new MeshStandardMaterial({
      color: MOURNEVEIL_PALETTE.environment.iron,
      roughness: 0.5,
      metalness: 0.74,
    }),
    cloth: new MeshStandardMaterial({
      color: MOURNEVEIL_PALETTE.environment.cloth,
      roughness: 0.9,
      metalness: 0,
    }),
    ember: new MeshStandardMaterial({
      color: '#ffd1a0',
      emissive: '#a64d21',
      emissiveIntensity: 1.55,
      roughness: 0.28,
    }),
    veil: new MeshStandardMaterial({
      color: '#b8f8ee',
      emissive: MOURNEVEIL_PALETTE.checkpoint.glowActive,
      emissiveIntensity: 1.45,
      roughness: 0.26,
    }),
  })

export function getOssuaryMaterial(key: OssuaryMaterialKey): MeshStandardMaterial {
  return OSSUARY_MATERIALS[key]
}
