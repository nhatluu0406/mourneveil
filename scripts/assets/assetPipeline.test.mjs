import { describe, expect, it } from 'vitest'
import { readAndValidateGltf, validateGltfDocument, validateProductionAssetManifest } from './assetPipeline.mjs'

const validAsset = {
  id: 'world.checkpoint.refuge-shrine', format: 'gltf2',
  sourcePath: 'assets/source/world/checkpoint/refuge-shrine.gltf',
  runtimePath: 'public/assets/world/checkpoint/refuge-shrine.gltf',
  runtimeUrl: '/assets/world/checkpoint/refuge-shrine.gltf',
  units: 'meters', upAxis: 'Y', pivot: 'ground-center',
  colliderPolicy: 'authored-world-proxy', provenance: 'project-authored', license: 'project-owned',
}

describe('production asset validation', () => {
  it('accepts the narrow stable source/runtime contract', () => {
    expect(validateProductionAssetManifest({ schemaVersion: 1, assets: [validAsset] }).assets[0]).toBe(validAsset)
  })

  it('rejects unsafe runtime references and absent provenance', () => {
    expect(() => validateProductionAssetManifest({ schemaVersion: 1, assets: [{ ...validAsset, runtimeUrl: validAsset.sourcePath }] })).toThrow('runtimeUrl')
    expect(() => validateProductionAssetManifest({ schemaVersion: 1, assets: [{ ...validAsset, provenance: '' }] })).toThrow('provenance')
  })

  it('rejects malformed glTF at the validation boundary', () => {
    expect(() => validateGltfDocument({ asset: { version: '1.0' } }, validAsset.id)).toThrow('glTF 2.0')
    expect(() => validateGltfDocument({ asset: { version: '2.0' }, scene: 0, scenes: [{}], meshes: [] }, validAsset.id)).toThrow('no render meshes')
    expect(() => validateGltfDocument({ asset: { version: '2.0' }, scene: 0, scenes: [{}], meshes: [{}], nodes: [{ rotation: [0, 1, 0] }], buffers: [] }, validAsset.id)).toThrow('invalid node transform')
  })

  it('reports a missing development asset with its stable id and path', async () => {
    await expect(
      readAndValidateGltf(process.cwd(), 'assets/source/missing.gltf', validAsset.id),
    ).rejects.toThrow(
      '[assets] world.checkpoint.refuge-shrine: missing asset file assets/source/missing.gltf',
    )
  })
})
