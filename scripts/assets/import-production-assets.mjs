import { copyFile, mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertAssetBudgets,
  readAndValidateAssetAt,
  readManifest,
} from './assetPipeline.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const manifest = await readManifest(repoRoot)
const sizes = new Map()

for (const asset of manifest.assets) {
  await readAndValidateAssetAt(repoRoot, asset, asset.sourcePath)
  const target = path.join(repoRoot, asset.runtimePath)
  await mkdir(path.dirname(target), { recursive: true })
  await copyFile(path.join(repoRoot, asset.sourcePath), target)
  sizes.set(asset.runtimePath, (await stat(target)).size)
  console.log(`[assets] imported ${asset.id} -> ${asset.runtimePath}`)
}

assertAssetBudgets(manifest.assets, sizes)
