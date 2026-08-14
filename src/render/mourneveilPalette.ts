/** Centralized Mourneveil presentation palette — projection only. */

export const MOURNEVEIL_PALETTE = Object.freeze({
  background: '#05090b',
  ambient: '#71898c',
  environment: Object.freeze({
    floor: '#151b1d',
    floorSlab: '#374241',
    ashStone: '#3a393d',
    wall: '#222b2b',
    blocker: '#332f2a',
    masonry: '#3d4643',
    recess: '#20292a',
    border: '#253131',
    bone: '#b8af99',
    bronze: '#775237',
    verdigris: '#3a716c',
    iron: '#202c2f',
    cloth: '#3b3035',
  }),
  player: Object.freeze({
    skin: '#c7ad8c',
    cloth: '#334b50',
    accent: '#7bd7df',
    metal: '#a9aea6',
  }),
  skirmisher: Object.freeze({
    body: '#3b6a58',
    accent: '#9fb59b',
    blade: '#9faea7',
    telegraph: '#72d8a0',
    contact: '#f06a54',
  }),
  brute: Object.freeze({
    body: '#704135',
    accent: '#5d332d',
    pauldron: '#75463a',
    weapon: '#a15b43',
    telegraph: '#e9994c',
    contact: '#ed5b4a',
  }),
  checkpoint: Object.freeze({
    inactive: '#607975',
    active: '#a7e7db',
    stone: '#485a58',
    glowInactive: '#142624',
    glowActive: '#3f8f88',
  }),
  echo: Object.freeze({
    core: '#67bdd4',
    aura: '#173e4b',
    tip: '#e5fbff',
  }),
  loot: Object.freeze({
    chest: '#9b7137',
    gem: '#e4d1a0',
    glow: '#6b4b25',
  }),
  shortcut: Object.freeze({
    closed: '#4b3727',
    open: '#846647',
    emissive: '#23160d',
  }),
  finalGate: Object.freeze({
    sealed: '#6e394f',
    open: '#a95c79',
    emissive: '#2c101f',
  }),
  warning: '#d9a55a',
  damage: '#f06a54',
})

export type MourneveilPalette = typeof MOURNEVEIL_PALETTE
