import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readAndValidateGltf, readManifest } from './assetPipeline.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const manifest = await readManifest(repoRoot)
for (const asset of manifest.assets) {
  await readAndValidateGltf(repoRoot, asset.sourcePath, asset.id)
  await readAndValidateGltf(repoRoot, asset.runtimePath, asset.id)
  const [source, runtime] = await Promise.all([
    readFile(path.join(repoRoot, asset.sourcePath)),
    readFile(path.join(repoRoot, asset.runtimePath)),
  ])
  if (!source.equals(runtime)) {
    throw new Error(`[assets] ${asset.id}: runtime asset drift; run npm run assets:import`)
  }
  console.log(`[assets] verified ${asset.id} at ${asset.runtimeUrl}`)
}
