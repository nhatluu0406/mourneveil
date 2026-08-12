import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m10-camera-occlusion-repro'
const PORT = 4199
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function soak(page, ms) {
  for (let i = 0; i < Math.ceil(ms / 40); i += 1) await page.waitForTimeout(40)
}

await runOwnedBrowserGate({
  port: PORT,
  artifactDir: OUT,
  run: async (page, { baseUrl }) => {
    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await soak(page, 1200)

    // Near divider wall — classic foreground occlusion case.
    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.resetMeleeFixture()
      g.restorePlayer()
      g.setPlayerPosition({ x: -4.2, y: 0.82, z: -3.6 })
      g.setPlayerFacing({ x: 1, z: 0 })
    })
    await soak(page, 900)
    await page.screenshot({ path: `${OUT}/01-near-divider.png`, fullPage: false })

    // Sample camera diagnostic from HUD panel text if present; also sample snapshot.
    const nearDivider = await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      const snap = g.snapshot()
      return {
        player: snap.player.position,
        facing: snap.player.facing,
        zone: snap.world.currentZoneId,
      }
    })
    console.log('NEAR_DIVIDER:', JSON.stringify(nearDivider))

    // Movement jitter sample: advance with movement intents if available, else teleport steps.
    const samples = await page.evaluate(async () => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -5.2, y: 0.82, z: 0.4 })
      g.setPlayerFacing({ x: 1, z: 0 })
      const out = []
      for (let i = 0; i < 40; i += 1) {
        g.setPlayerFacing(i % 8 < 4 ? { x: 1, z: 0 } : { x: 0, z: 1 })
        g.setPlayerPosition({
          x: -5.2 + i * 0.08,
          y: 0.82,
          z: 0.4 + (i % 2) * 0.02,
        })
        // allow a few sim steps
        g.advance(2)
        out.push({
          i,
          player: { ...g.snapshot().player.position },
          facing: { ...g.snapshot().player.facing },
        })
      }
      return out
    })
    console.log('FACING_FLIP_SAMPLES:', JSON.stringify(samples.slice(0, 8)))
    await soak(page, 800)
    await page.screenshot({ path: `${OUT}/02-facing-flip-path.png`, fullPage: false })

    // Corridor wall case
    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -7.9, y: 0.82, z: 1.65 })
      g.setPlayerFacing({ x: -1, z: 1 })
    })
    await soak(page, 900)
    await page.screenshot({ path: `${OUT}/03-corridor.png`, fullPage: false })

    // SE silhouette / camera-near mass case near refuge
    await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -4.0, y: 0.82, z: 1.0 })
      g.setPlayerFacing({ x: 1, z: 1 })
    })
    await soak(page, 900)
    await page.screenshot({ path: `${OUT}/04-refuge-se-silhouette.png`, fullPage: false })

    pass('repro captures written')
  },
})

if (failures.length > 0) {
  console.error(`${failures.length} repro failure(s)`)
  process.exit(1)
}
console.log('\nREPRO CAPTURE DONE — inspect', OUT)
