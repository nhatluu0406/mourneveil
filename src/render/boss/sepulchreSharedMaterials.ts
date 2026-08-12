import { MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { SEPULCHRE_COLORS } from './SepulchreMaterials'

/** Shared boss materials — one instance per role; never clone per mesh mount. */
export const SEPULCHRE_MATERIALS = Object.freeze({
  innerIron: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.innerIron,
    roughness: 0.68,
    metalness: 0.44,
  }),
  weaponIron: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.innerIron,
    roughness: 0.38,
    metalness: 0.76,
  }),
  headIron: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.innerIron,
    roughness: 0.52,
    metalness: 0.5,
  }),
  mortuaryPlate: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.mortuaryPlate,
    roughness: 0.58,
    metalness: 0.34,
  }),
  weaponPlate: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.mortuaryPlate,
    roughness: 0.3,
    metalness: 0.72,
  }),
  bone: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.bone,
    roughness: 0.66,
    metalness: 0.04,
  }),
  headBone: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.bone,
    roughness: 0.64,
    metalness: 0.04,
  }),
  shoulderBone: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.bone,
    roughness: 0.54,
    metalness: 0.08,
  }),
  bronze: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.bronze,
    roughness: 0.54,
    metalness: 0.5,
  }),
  weaponBronze: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.bronze,
    roughness: 0.42,
    metalness: 0.68,
  }),
  crownBronze: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.bronze,
    roughness: 0.48,
    metalness: 0.42,
  }),
  crownBand: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.bronze,
    roughness: 0.44,
    metalness: 0.62,
  }),
  veilCore: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.veil,
    emissive: SEPULCHRE_COLORS.veilDeep,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  }),
  veilMark: new MeshStandardMaterial({
    color: SEPULCHRE_COLORS.veil,
    emissive: SEPULCHRE_COLORS.veilDeep,
    emissiveIntensity: 1.4,
  }),
  veilCue: new MeshBasicMaterial({
    color: SEPULCHRE_COLORS.veil,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
  }),
  veilCueStrong: new MeshBasicMaterial({
    color: SEPULCHRE_COLORS.veil,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  }),
  veilCueSoft: new MeshBasicMaterial({
    color: SEPULCHRE_COLORS.veil,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  }),
  veilBlade: new MeshBasicMaterial({
    color: SEPULCHRE_COLORS.veil,
    transparent: true,
    opacity: 0.7,
  }),
  funeralFire: new MeshBasicMaterial({
    color: SEPULCHRE_COLORS.funeralFire,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: 2,
  }),
  bronzeCue: new MeshBasicMaterial({
    color: SEPULCHRE_COLORS.bronze,
    transparent: true,
    opacity: 0.64,
    depthWrite: false,
    side: 2,
  }),
  boneCue: new MeshBasicMaterial({
    color: SEPULCHRE_COLORS.bone,
    transparent: true,
    opacity: 0.72,
  }),
  ashCue: new MeshBasicMaterial({
    color: SEPULCHRE_COLORS.ash,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: 2,
  }),
})
