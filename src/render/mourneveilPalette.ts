/** Centralized Mourneveil presentation palette — projection only. */

export const MOURNEVEIL_PALETTE = Object.freeze({
  background: '#0c1014',
  ambient: '#9aa6b0',
  environment: Object.freeze({
    floor: '#161c1a',
    wall: '#4a5450',
    blocker: '#6d5c48',
    masonry: '#3e4642',
    border: '#2a3230',
  }),
  player: Object.freeze({
    skin: '#d8b48a',
    cloth: '#c9a06a',
    accent: '#3f8f9a',
    metal: '#c4b49a',
  }),
  skirmisher: Object.freeze({
    body: '#5a8f78',
    accent: '#9dcfb0',
    blade: '#c5d4c8',
    telegraph: '#7dffb0',
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
    stone: '#7f9488',
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
    closed: '#c4893d',
    open: '#d7a35a',
    emissive: '#5a3a12',
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
