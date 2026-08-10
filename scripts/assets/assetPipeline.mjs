import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/

export function validateProductionAssetManifest(value) {
  if (value?.schemaVersion !== 1 || !Array.isArray(value.assets) || value.assets.length === 0) {
    throw new Error('[assets] manifest must use schemaVersion 1 and contain assets')
  }
  const ids = new Set()
  for (const asset of value.assets) {
    const label = typeof asset?.id === 'string' ? asset.id : '<unknown>'
    if (!ID_PATTERN.test(label) || ids.has(label)) throw new Error(`[assets] invalid/duplicate id: ${label}`)
    ids.add(label)
    if (asset.format !== 'gltf2') throw new Error(`[assets] ${label}: unsupported format ${asset.format}`)
    if (!asset.sourcePath?.startsWith('assets/source/') || !asset.sourcePath.endsWith('.gltf')) {
      throw new Error(`[assets] ${label}: sourcePath must be an editable assets/source/*.gltf file`)
    }
    if (!asset.runtimePath?.startsWith('public/assets/') || !asset.runtimePath.endsWith('.gltf')) {
      throw new Error(`[assets] ${label}: runtimePath must be a public/assets/*.gltf file`)
    }
    if (asset.runtimeUrl !== `/${asset.runtimePath.slice('public/'.length)}`) {
      throw new Error(`[assets] ${label}: runtimeUrl must match runtimePath`)
    }
    if (asset.units !== 'meters' || asset.upAxis !== 'Y' || asset.pivot !== 'ground-center') {
      throw new Error(`[assets] ${label}: expected meters, Y-up, ground-center contract`)
    }
    if (asset.colliderPolicy !== 'authored-world-proxy') {
      throw new Error(`[assets] ${label}: render meshes cannot own gameplay collision`)
    }
    if (!asset.provenance?.trim() || !asset.license?.trim()) {
      throw new Error(`[assets] ${label}: provenance and license are required`)
    }
  }
  return value
}

export function validateGltfDocument(document, label) {
  if (document?.asset?.version !== '2.0') throw new Error(`[assets] ${label}: expected glTF 2.0`)
  if (!Number.isInteger(document.scene) || !Array.isArray(document.scenes) || !document.scenes[document.scene]) {
    throw new Error(`[assets] ${label}: missing default scene`)
  }
  if (!Array.isArray(document.meshes) || document.meshes.length === 0) {
    throw new Error(`[assets] ${label}: no render meshes`)
  }
  if (!Array.isArray(document.buffers) || document.buffers.some((buffer) => !buffer.uri?.startsWith('data:'))) {
    throw new Error(`[assets] ${label}: first slice requires embedded deterministic buffers`)
  }
  return document
}

export async function readManifest(repoRoot, manifestPath = 'assets/production-assets.json') {
  const absolute = path.join(repoRoot, manifestPath)
  try {
    return validateProductionAssetManifest(JSON.parse(await readFile(absolute, 'utf8')))
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error(`[assets] missing manifest: ${manifestPath}`)
    throw error
  }
}

export async function readAndValidateGltf(repoRoot, assetPath, id) {
  const absolute = path.join(repoRoot, assetPath)
  try {
    return validateGltfDocument(JSON.parse(await readFile(absolute, 'utf8')), id)
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error(`[assets] ${id}: missing asset file ${assetPath}`)
    if (error instanceof SyntaxError) throw new Error(`[assets] ${id}: malformed JSON in ${assetPath}`)
    throw error
  }
}
