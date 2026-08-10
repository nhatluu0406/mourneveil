import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readAndValidateGltf, readManifest } from './assetPipeline.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const manifest = await readManifest(repoRoot)
for (const asset of manifest.assets) {
  await readAndValidateGltf(repoRoot, asset.sourcePath, asset.id)
  const target = path.join(repoRoot, asset.runtimePath)
  await mkdir(path.dirname(target), { recursive: true })
  await copyFile(path.join(repoRoot, asset.sourcePath), target)
  console.log(`[assets] imported ${asset.id} -> ${asset.runtimePath}`)
}
