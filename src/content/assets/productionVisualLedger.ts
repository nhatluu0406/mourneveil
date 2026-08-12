export interface ProductionVisualAssetRecord {
  readonly id: string
  readonly sourcePath: string
  readonly runtimeOwner: string
  readonly units: 'meters'
  readonly upAxis: 'Y'
  readonly pivot: 'ground-center'
  readonly colliderPolicy: 'existing-authored-proxy' | 'none-presentation-only'
  readonly provenance: string
  readonly license: string
}

/** Code-native authored geometry uses the same ownership rigor as imported M8 assets. */
export const PRODUCTION_VISUAL_ASSETS = Object.freeze([
  {
    id: 'actor.player.veilbound-warden',
    sourcePath: 'src/render/PlayerVisual.tsx',
    runtimeOwner: 'PlayerVisual',
    units: 'meters',
    upAxis: 'Y',
    pivot: 'ground-center',
    colliderPolicy: 'existing-authored-proxy',
    provenance: 'Original Mourneveil project-authored geometry; no third-party content.',
    license: 'Project-owned; redistribution remains controlled by the repository owner.',
  },
  {
    id: 'weapon.player.oathblade',
    sourcePath: 'src/render/productionGeometry.ts',
    runtimeOwner: 'PlayerVisual',
    units: 'meters',
    upAxis: 'Y',
    pivot: 'ground-center',
    colliderPolicy: 'none-presentation-only',
    provenance: 'Original Mourneveil project-authored geometry; no third-party content.',
    license: 'Project-owned; redistribution remains controlled by the repository owner.',
  },
  {
    id: 'enemy.skirmisher.veil-riven',
    sourcePath: 'src/render/EnemyVisual.tsx',
    runtimeOwner: 'EnemyVisual',
    units: 'meters',
    upAxis: 'Y',
    pivot: 'ground-center',
    colliderPolicy: 'existing-authored-proxy',
    provenance: 'Original Mourneveil project-authored geometry; no third-party content.',
    license: 'Project-owned; redistribution remains controlled by the repository owner.',
  },
  {
    id: 'enemy.brute.ossuary-bulwark',
    sourcePath: 'src/render/EnemyVisual.tsx',
    runtimeOwner: 'EnemyVisual',
    units: 'meters',
    upAxis: 'Y',
    pivot: 'ground-center',
    colliderPolicy: 'existing-authored-proxy',
    provenance: 'Original Mourneveil project-authored geometry; no third-party content.',
    license: 'Project-owned; redistribution remains controlled by the repository owner.',
  },
  {
    id: 'world.kit.ossuary-hero',
    sourcePath: 'src/render/OssuaryHeroDressing.tsx',
    runtimeOwner: 'ConnectedLevelVisual',
    units: 'meters',
    upAxis: 'Y',
    pivot: 'ground-center',
    colliderPolicy: 'none-presentation-only',
    provenance: 'Original Mourneveil project-authored geometry; no third-party content.',
    license: 'Project-owned; redistribution remains controlled by the repository owner.',
  },
] as const satisfies readonly ProductionVisualAssetRecord[])
