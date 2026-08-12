/** Centralized Mourneveil presentation palette — projection only. */

export const MOURNEVEIL_PALETTE = Object.freeze({
  background: '#0d1418',
  ambient: '#9eb4b8',
  environment: Object.freeze({
    floor: '#243230',
    floorSlab: '#3d4b46',
    wall: '#42514c',
    blocker: '#64685a',
    masonry: '#55635d',
    recess: '#243033',
    border: '#35433e',
    bone: '#c4bea8',
    bronze: '#8a724e',
    verdigris: '#568278',
    iron: '#2f393c',
    cloth: '#4a434b',
  }),
  player: Object.freeze({
    skin: '#d0ba9a',
    cloth: '#3a5156',
    accent: '#7fdee4',
    metal: '#c2c6bc',
  }),
  skirmisher: Object.freeze({
    body: '#5a8a74',
    accent: '#b2c9aa',
    blade: '#b6c3b8',
    telegraph: '#7cdaa1',
    contact: '#ff6b5c',
  }),
  brute: Object.freeze({
    body: '#9a5e4c',
    accent: '#78443a',
    pauldron: '#8c5646',
    weapon: '#c2765e',
    telegraph: '#ff9d4d',
    contact: '#ff574d',
  }),
  checkpoint: Object.freeze({
    inactive: '#86a098',
    active: '#b4f0d6',
    stone: '#70827b',
    glowInactive: '#22342a',
    glowActive: '#56a084',
  }),
  echo: Object.freeze({
    core: '#6ec0e0',
    aura: '#24566a',
    tip: '#e8f7ff',
  }),
  loot: Object.freeze({
    chest: '#b8964a',
    gem: '#f0e2b0',
    glow: '#8a7030',
  }),
  shortcut: Object.freeze({
    closed: '#59472f',
    open: '#9d8054',
    emissive: '#30200f',
  }),
  finalGate: Object.freeze({
    sealed: '#8a4d63',
    open: '#c27a96',
    emissive: '#401828',
  }),
  warning: '#e8b45a',
  damage: '#ff6b5c',
})

export type MourneveilPalette = typeof MOURNEVEIL_PALETTE
