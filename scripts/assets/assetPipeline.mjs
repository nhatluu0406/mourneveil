import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/
const GLTF_FORMAT = 'gltf2'
const GLB_FORMAT = 'glb'
const SUPPORTED_FORMATS = new Set([GLTF_FORMAT, GLB_FORMAT])
const TEXTURE_POLICIES = new Set(['none-external', 'embedded-only'])
const ENEMY_ANIMATION_SEMANTICS = [
  'idle',
  'locomotion',
  'enemy-attack',
  'hit-reaction',
  'defeated',
]

/** M10 production ceiling; proof fixtures keep explicit 64 KiB entry limits. */
export const ASSET_BUDGETS = Object.freeze({
  maxBytesPerAsset: 2 * 1024 * 1024,
  maxTotalRuntimeBytes: 12 * 1024 * 1024,
})

export function validateProductionAssetManifest(value) {
  if (value?.schemaVersion !== 1 || !Array.isArray(value.assets) || value.assets.length === 0) {
    throw new Error('[assets] manifest must use schemaVersion 1 and contain assets')
  }
  const ids = new Set()
  for (const asset of value.assets) {
    const label = typeof asset?.id === 'string' ? asset.id : '<unknown>'
    if (!ID_PATTERN.test(label) || ids.has(label)) throw new Error(`[assets] invalid/duplicate id: ${label}`)
    ids.add(label)
    if (!SUPPORTED_FORMATS.has(asset.format)) {
      throw new Error(`[assets] ${label}: unsupported format ${asset.format}; expected gltf2|glb`)
    }
    const extension = asset.format === GLB_FORMAT ? '.glb' : '.gltf'
    if (!asset.sourcePath?.startsWith('assets/source/') || !asset.sourcePath.endsWith(extension)) {
      throw new Error(
        `[assets] ${label}: sourcePath must be an editable assets/source/*${extension} file`,
      )
    }
    if (!asset.runtimePath?.startsWith('public/assets/') || !asset.runtimePath.endsWith(extension)) {
      throw new Error(`[assets] ${label}: runtimePath must be a public/assets/*${extension} file`)
    }
    if (asset.runtimeUrl !== `/${asset.runtimePath.slice('public/'.length)}`) {
      throw new Error(`[assets] ${label}: runtimeUrl must match runtimePath`)
    }
    if (asset.units !== 'meters' || asset.upAxis !== 'Y' || asset.pivot !== 'ground-center') {
      throw new Error(`[assets] ${label}: expected meters, Y-up, ground-center contract`)
    }
    if (
      !Array.isArray(asset.scale) ||
      asset.scale.length !== 3 ||
      asset.scale.some((value) => !Number.isFinite(value) || value === 0) ||
      !Array.isArray(asset.rotationRadians) ||
      asset.rotationRadians.length !== 3 ||
      asset.rotationRadians.some((value) => !Number.isFinite(value))
    ) {
      throw new Error(`[assets] ${label}: invalid scale/orientation metadata`)
    }
    if (asset.colliderPolicy !== 'authored-world-proxy') {
      throw new Error(`[assets] ${label}: render meshes cannot own gameplay collision`)
    }
    if (!TEXTURE_POLICIES.has(asset.textures ?? 'none-external')) {
      throw new Error(
        `[assets] ${label}: textures must be none-external|embedded-only (no external/CDN/KTX2)`,
      )
    }
    if (!asset.provenance?.trim() || !asset.license?.trim()) {
      throw new Error(`[assets] ${label}: provenance and license are required`)
    }
    if (asset.animationSemantics !== undefined) {
      validateAnimationSemantics(asset.animationSemantics, label)
    }
  }
  return value
}

export function validateAnimationSemantics(semantics, label) {
  if (semantics === null || typeof semantics !== 'object' || Array.isArray(semantics)) {
    throw new Error(`[assets] ${label}: animationSemantics must be an object`)
  }
  const usedClips = new Set()
  for (const semantic of ENEMY_ANIMATION_SEMANTICS) {
    const clip = semantics[semantic]
    if (typeof clip !== 'string' || clip.trim() === '') {
      throw new Error(
        `[assets] ${label}: missing required animation semantic "${semantic}" (expected clip name string)`,
      )
    }
    if (usedClips.has(clip)) {
      throw new Error(
        `[assets] ${label}: duplicate/ambiguous animation mapping for clip "${clip}"`,
      )
    }
    usedClips.add(clip)
  }
  const extras = Object.keys(semantics).filter((key) => !ENEMY_ANIMATION_SEMANTICS.includes(key))
  if (extras.length > 0) {
    throw new Error(
      `[assets] ${label}: unknown animation semantic(s) ${extras.join(', ')}; keep mapping at asset boundary`,
    )
  }
  return semantics
}

export function validateGltfDocument(document, label, options = {}) {
  if (document?.asset?.version !== '2.0') throw new Error(`[assets] ${label}: expected glTF 2.0`)
  if (!Number.isInteger(document.scene) || !Array.isArray(document.scenes) || !document.scenes[document.scene]) {
    throw new Error(`[assets] ${label}: missing default scene`)
  }
  if (!Array.isArray(document.meshes) || document.meshes.length === 0) {
    throw new Error(`[assets] ${label}: no render meshes`)
  }
  if (
    !Array.isArray(document.nodes) ||
    document.nodes.some(
      (node) =>
        (node.rotation !== undefined &&
          (node.rotation.length !== 4 || node.rotation.some((value) => !Number.isFinite(value)))) ||
        (node.scale !== undefined &&
          (node.scale.length !== 3 || node.scale.some((value) => !Number.isFinite(value)))),
    )
  ) {
    throw new Error(`[assets] ${label}: invalid node transform`)
  }

  const allowBinaryChunkBuffer = options.allowBinaryChunkBuffer === true
  if (!Array.isArray(document.buffers) || document.buffers.length === 0) {
    throw new Error(`[assets] ${label}: missing buffers`)
  }
  for (const [index, buffer] of document.buffers.entries()) {
    if (allowBinaryChunkBuffer && index === 0 && buffer.uri === undefined) continue
    if (!buffer.uri?.startsWith('data:')) {
      throw new Error(
        `[assets] ${label}: external/non-embedded buffers are not allowed; expected data: URI or GLB binary chunk`,
      )
    }
  }
  if (Array.isArray(document.images)) {
    for (const image of document.images) {
      if (image.uri !== undefined && !image.uri.startsWith('data:')) {
        throw new Error(
          `[assets] ${label}: external textures are not allowed (${image.uri}); embed or use none-external`,
        )
      }
    }
  }
  if (options.requireSkinned === true) {
    if (!Array.isArray(document.skins) || document.skins.length === 0) {
      throw new Error(`[assets] ${label}: expected skinned mesh (missing skins)`)
    }
  }
  if (options.animationSemantics) {
    const clipNames = new Set((document.animations ?? []).map((entry) => entry.name).filter(Boolean))
    for (const [semantic, clipName] of Object.entries(options.animationSemantics)) {
      if (!clipNames.has(clipName)) {
        throw new Error(
          `[assets] ${label}: missing required animation clip "${clipName}" for semantic "${semantic}"`,
        )
      }
    }
  }
  return document
}

export function parseGlb(buffer, label) {
  if (buffer.byteLength < 12) throw new Error(`[assets] ${label}: malformed GLB (too short)`)
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const magic = view.getUint32(0, true)
  const version = view.getUint32(4, true)
  const length = view.getUint32(8, true)
  if (magic !== 0x46546c67) throw new Error(`[assets] ${label}: malformed GLB (bad magic)`)
  if (version !== 2) throw new Error(`[assets] ${label}: expected GLB version 2`)
  if (length !== buffer.byteLength) {
    throw new Error(`[assets] ${label}: malformed GLB (length mismatch)`)
  }
  let offset = 12
  let json = null
  while (offset + 8 <= buffer.byteLength) {
    const chunkLength = view.getUint32(offset, true)
    const chunkType = view.getUint32(offset + 4, true)
    offset += 8
    const chunk = buffer.subarray(offset, offset + chunkLength)
    offset += chunkLength
    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(Buffer.from(chunk).toString('utf8'))
    }
  }
  if (json === null) throw new Error(`[assets] ${label}: malformed GLB (missing JSON chunk)`)
  return json
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

export async function readAndValidateAssetAt(repoRoot, asset, assetPath) {
  const absolute = path.join(repoRoot, assetPath)
  try {
    if (asset.format === GLB_FORMAT) {
      const bytes = await readFile(absolute)
      const document = parseGlb(bytes, asset.id)
      return validateGltfDocument(document, asset.id, {
        allowBinaryChunkBuffer: true,
        requireSkinned: asset.skinned === true,
        animationSemantics: asset.animationSemantics,
      })
    }
    return validateGltfDocument(JSON.parse(await readFile(absolute, 'utf8')), asset.id, {
      animationSemantics: asset.animationSemantics,
    })
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error(`[assets] ${asset.id}: missing asset file ${assetPath}`)
    if (error instanceof SyntaxError) throw new Error(`[assets] ${asset.id}: malformed JSON in ${assetPath}`)
    throw error
  }
}

/** @deprecated Prefer readAndValidateAssetAt with the manifest entry. */
export async function readAndValidateGltf(repoRoot, assetPath, id) {
  const absolute = path.join(repoRoot, assetPath)
  try {
    if (assetPath.endsWith('.glb')) {
      const bytes = await readFile(absolute)
      return validateGltfDocument(parseGlb(bytes, id), id, { allowBinaryChunkBuffer: true })
    }
    return validateGltfDocument(JSON.parse(await readFile(absolute, 'utf8')), id)
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error(`[assets] ${id}: missing asset file ${assetPath}`)
    if (error instanceof SyntaxError) throw new Error(`[assets] ${id}: malformed JSON in ${assetPath}`)
    throw error
  }
}

export function assertAssetBudgets(assets, sizesByRuntimePath) {
  let total = 0
  for (const asset of assets) {
    const size = sizesByRuntimePath.get(asset.runtimePath)
    if (size === undefined) {
      throw new Error(`[assets] ${asset.id}: missing runtime size for budget check (${asset.runtimePath})`)
    }
    const limit = Number.isFinite(asset.maxBytes) ? asset.maxBytes : ASSET_BUDGETS.maxBytesPerAsset
    if (size > limit) {
      throw new Error(
        `[assets] ${asset.id}: budget violation at ${asset.runtimePath} (${size} bytes > ${limit} byte limit); reduce geometry/clips or raise an evidence-backed budget`,
      )
    }
    total += size
  }
  if (total > ASSET_BUDGETS.maxTotalRuntimeBytes) {
    throw new Error(
      `[assets] total runtime budget violation (${total} bytes > ${ASSET_BUDGETS.maxTotalRuntimeBytes}); split or reduce assets`,
    )
  }
}
