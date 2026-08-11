import { readFile, stat } from 'node:fs/promises'
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
  await readAndValidateAssetAt(repoRoot, asset, asset.runtimePath)
  const [source, runtime] = await Promise.all([
    readFile(path.join(repoRoot, asset.sourcePath)),
    readFile(path.join(repoRoot, asset.runtimePath)),
  ])
  if (!source.equals(runtime)) {
    throw new Error(`[assets] ${asset.id}: runtime asset drift; run npm run assets:import`)
  }
  sizes.set(asset.runtimePath, (await stat(path.join(repoRoot, asset.runtimePath))).size)
  console.log(`[assets] verified ${asset.id} at ${asset.runtimeUrl}`)
}

assertAssetBudgets(manifest.assets, sizes)
