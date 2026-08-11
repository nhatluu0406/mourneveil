import { describe, expect, it } from 'vitest'
import {
  ASSET_BUDGETS,
  assertAssetBudgets,
  parseGlb,
  validateAnimationSemantics,
  validateGltfDocument,
  validateProductionAssetManifest,
  readAndValidateGltf,
} from './assetPipeline.mjs'

const validAsset = {
  id: 'world.checkpoint.refuge-shrine',
  format: 'gltf2',
  sourcePath: 'assets/source/world/checkpoint/refuge-shrine.gltf',
  runtimePath: 'public/assets/world/checkpoint/refuge-shrine.gltf',
  runtimeUrl: '/assets/world/checkpoint/refuge-shrine.gltf',
  scale: [1, 1, 1],
  rotationRadians: [0, 0, 0],
  units: 'meters',
  upAxis: 'Y',
  pivot: 'ground-center',
  textures: 'none-external',
  colliderPolicy: 'authored-world-proxy',
  provenance: 'project-authored',
  license: 'project-owned',
}

const validGlbAsset = {
  id: 'enemy.skirmisher.proof',
  format: 'glb',
  sourcePath: 'assets/source/enemies/skirmisher/skirmisher-proof.glb',
  runtimePath: 'public/assets/enemies/skirmisher/skirmisher-proof.glb',
  runtimeUrl: '/assets/enemies/skirmisher/skirmisher-proof.glb',
  scale: [1, 1, 1],
  rotationRadians: [0, 0, 0],
  units: 'meters',
  upAxis: 'Y',
  pivot: 'ground-center',
  textures: 'none-external',
  skinned: true,
  animationSemantics: {
    idle: 'Clip_Skirm_Idle',
    locomotion: 'Clip_Skirm_Walk',
    'enemy-attack': 'Clip_Skirm_Strike',
    'hit-reaction': 'Clip_Skirm_Hit',
    defeated: 'Clip_Skirm_Death',
  },
  colliderPolicy: 'authored-world-proxy',
  maxBytes: 65536,
  provenance: 'project-authored',
  license: 'project-owned',
}

describe('production asset validation', () => {
  it('accepts glTF and GLB contracts with budgets metadata', () => {
    expect(
      validateProductionAssetManifest({ schemaVersion: 1, assets: [validAsset, validGlbAsset] })
        .assets,
    ).toHaveLength(2)
    expect(ASSET_BUDGETS.maxBytesPerAsset).toBe(262144)
  })

  it('rejects unsafe runtime references and absent provenance', () => {
    expect(() =>
      validateProductionAssetManifest({
        schemaVersion: 1,
        assets: [{ ...validAsset, runtimeUrl: validAsset.sourcePath }],
      }),
    ).toThrow('runtimeUrl')
    expect(() =>
      validateProductionAssetManifest({
        schemaVersion: 1,
        assets: [{ ...validAsset, provenance: '' }],
      }),
    ).toThrow('provenance')
  })

  it('rejects malformed glTF and invalid animation semantics', () => {
    expect(() => validateGltfDocument({ asset: { version: '1.0' } }, validAsset.id)).toThrow(
      'glTF 2.0',
    )
    expect(() =>
      validateAnimationSemantics(
        {
          idle: 'a',
          locomotion: 'a',
          'enemy-attack': 'c',
          'hit-reaction': 'd',
          defeated: 'e',
        },
        validGlbAsset.id,
      ),
    ).toThrow('duplicate/ambiguous')
    expect(() =>
      validateAnimationSemantics(
        {
          idle: 'a',
          locomotion: 'b',
          'enemy-attack': 'c',
          'hit-reaction': 'd',
        },
        validGlbAsset.id,
      ),
    ).toThrow('missing required animation semantic "defeated"')
  })

  it('reports a missing development asset with its stable id and path', async () => {
    await expect(
      readAndValidateGltf(process.cwd(), 'assets/source/missing.gltf', validAsset.id),
    ).rejects.toThrow(
      '[assets] world.checkpoint.refuge-shrine: missing asset file assets/source/missing.gltf',
    )
  })

  it('parses GLB magic and rejects budget violations with remediation', () => {
    const json = Buffer.from(
      JSON.stringify({
        asset: { version: '2.0' },
        scene: 0,
        scenes: [{}],
        meshes: [{}],
        nodes: [],
        buffers: [{}],
      }),
    )
    const jsonPadding = (4 - (json.byteLength % 4)) % 4
    const jsonChunk = Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)])
    const totalLength = 12 + 8 + jsonChunk.byteLength
    const header = Buffer.alloc(12)
    header.writeUInt32LE(0x46546c67, 0)
    header.writeUInt32LE(2, 4)
    header.writeUInt32LE(totalLength, 8)
    const chunkHeader = Buffer.alloc(8)
    chunkHeader.writeUInt32LE(jsonChunk.byteLength, 0)
    chunkHeader.writeUInt32LE(0x4e4f534a, 4)
    const glb = Buffer.concat([header, chunkHeader, jsonChunk])
    expect(parseGlb(glb, 'probe').asset.version).toBe('2.0')

    expect(() =>
      assertAssetBudgets(
        [{ id: 'enemy.skirmisher.proof', runtimePath: 'public/assets/x.glb', maxBytes: 10 }],
        new Map([['public/assets/x.glb', 11]]),
      ),
    ).toThrow('budget violation')
  })
})
