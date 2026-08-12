/** Centralized Mourneveil presentation palette — projection only. */

export const MOURNEVEIL_PALETTE = Object.freeze({
  background: '#070b0e',
  ambient: '#81949a',
  environment: Object.freeze({
    floor: '#101716',
    floorSlab: '#242d2a',
    wall: '#27312f',
    blocker: '#45483d',
    masonry: '#39433f',
    recess: '#0b1111',
    border: '#1d2825',
    bone: '#a8a38f',
    bronze: '#6e5838',
    verdigris: '#3f625b',
    iron: '#161c1d',
    cloth: '#342f35',
  }),
  player: Object.freeze({
    skin: '#b8a182',
    cloth: '#26373a',
    accent: '#69c9d0',
    metal: '#a9ada3',
  }),
  skirmisher: Object.freeze({
    body: '#426b59',
    accent: '#94b08e',
    blade: '#9ca99f',
    telegraph: '#7cdaa1',
    contact: '#ff6b5c',
  }),
  brute: Object.freeze({
    body: '#7a4536',
    accent: '#5a2f28',
    pauldron: '#6d3d30',
    weapon: '#a35a45',
    telegraph: '#ff9d4d',
    contact: '#ff574d',
  }),
  checkpoint: Object.freeze({
    inactive: '#6a8076',
    active: '#9fe0c4',
    stone: '#54635e',
    glowInactive: '#152018',
    glowActive: '#3f7a64',
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
