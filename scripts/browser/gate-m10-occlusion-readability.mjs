import { access, constants } from 'node:fs/promises'
import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'
import { withFreshQuery } from './freshSession.mjs'

const OUT = 'tmp-m10-occlusion-readability'
const PORT = 4202
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function soak(page, ms) {
  for (let i = 0; i < Math.ceil(ms / 40); i += 1) await page.waitForTimeout(40)
}

async function centerFrameIsLit(page, screenshotPath) {
  const fs = await import('node:fs/promises')
  const bytes = await fs.readFile(screenshotPath)
  const b64 = bytes.toString('base64')
  return page.evaluate((pngBase64) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const x0 = Math.floor(canvas.width * 0.35)
        const y0 = Math.floor(canvas.height * 0.35)
        const w = Math.floor(canvas.width * 0.3)
        const h = Math.floor(canvas.height * 0.3)
        const { data } = ctx.getImageData(x0, y0, w, h)
        let lit = 0
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] + data[i + 1] + data[i + 2] > 36) lit += 1
        }
        resolve({ ok: lit > w * h * 0.02, lit, total: w * h })
      }
      img.onerror = () => resolve({ ok: false, lit: 0, total: 0 })
      img.src = `data:image/png;base64,${pngBase64}`
    })
  }, b64)
}

async function centerFrameHasPlayerReadableGlow(page, screenshotPath) {
  const fs = await import('node:fs/promises')
  const bytes = await fs.readFile(screenshotPath)
  const b64 = bytes.toString('base64')
  return page.evaluate((pngBase64) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const x0 = Math.floor(canvas.width * 0.42)
        const y0 = Math.floor(canvas.height * 0.38)
        const w = Math.floor(canvas.width * 0.16)
        const h = Math.floor(canvas.height * 0.22)
        const { data } = ctx.getImageData(x0, y0, w, h)
        let cyan = 0
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          // Warden chest/core + oathblade read as cool cyan/teal highlights.
          if (b > 70 && g > 50 && b > r + 15) cyan += 1
        }
        resolve({ ok: cyan > 40, cyan, total: w * h })
      }
      img.onerror = () => resolve({ ok: false, cyan: 0, total: 0 })
      img.src = `data:image/png;base64,${pngBase64}`
    })
  }, b64)
}

async function exists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

let cleanupReport = null
await runOwnedBrowserGate({
  port: PORT,
  artifactDir: OUT,
  afterCleanup: (report) => {
    cleanupReport = report
  },
  run: async (page, { baseUrl }) => {
    const pageErrors = []
    page.on('pageerror', (error) => {
      pageErrors.push(String(error))
      console.error(`PAGE ERROR: ${error}`)
    })
    await page.goto(withFreshQuery(baseUrl), { waitUntil: 'load' })
    await page.waitForSelector('canvas', { timeout: 30_000 })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, { timeout: 30_000 })
    await soak(page, 1200)

    const cases = [
      {
        name: '01-divider-foreground',
        position: { x: -4.2, y: 0.82, z: -3.6 },
        facing: { x: 1, z: 0 },
      },
      {
        name: '02-corridor',
        position: { x: -7.9, y: 0.82, z: 1.65 },
        facing: { x: -1, z: 1 },
      },
      {
        name: '03-refuge',
        position: { x: -5.2, y: 0.82, z: 0.4 },
        facing: { x: 0, z: -1 },
      },
      {
        name: '04-mixed-court',
        position: { x: 1.1, y: 0.82, z: -4.15 },
        facing: { x: 1, z: 0 },
      },
      {
        name: '05-ash-walk',
        position: { x: 6.3, y: 0.82, z: -4.1 },
        facing: { x: 1, z: 0 },
      },
      {
        name: '06-near-shortcut-gate',
        position: { x: -2.2, y: 0.82, z: -1.3 },
        facing: { x: -1, z: 0 },
      },
    ]

    for (const entry of cases) {
      await page.evaluate(({ position, facing }) => {
        const g = window.__MOURNEVEIL_GATE__
        g.resetMeleeFixture()
        g.restorePlayer()
        g.setPlayerPosition(position)
        g.setPlayerFacing(facing)
      }, entry)
      await soak(page, 1000)
      await page.screenshot({ path: `${OUT}/${entry.name}.png`, fullPage: false })
      if (entry.name === '01-divider-foreground') {
        const glow = await centerFrameHasPlayerReadableGlow(page, `${OUT}/${entry.name}.png`)
        glow.ok
          ? pass(`${entry.name} player glow readable (cyan=${glow.cyan}/${glow.total})`)
          : fail(`${entry.name} player still hidden behind foreground mass: ${JSON.stringify(glow)}`)
      }
      const probe = await centerFrameIsLit(page, `${OUT}/${entry.name}.png`)
      probe.ok
        ? pass(`${entry.name} center frame has visible world pixels (lit=${probe.lit}/${probe.total})`)
        : fail(`${entry.name} center frame still black/occluded: ${JSON.stringify(probe)}`)
    }

    // Collision still works after proxy visual removal.
    const blocked = await page.evaluate(() => {
      const g = window.__MOURNEVEIL_GATE__
      g.setPlayerPosition({ x: -4.5, y: 0.82, z: -3.6 })
      g.setPlayerFacing({ x: 1, z: 0 })
      for (let i = 0; i < 40; i += 1) g.advance(1, { horizontal: 1, forward: 0 })
      return g.snapshot().player.position
    })
    blocked.x < -3.15
      ? pass(`divider collision still blocks (x=${blocked.x.toFixed(3)})`)
      : fail(`divider collision failed (x=${blocked.x})`)

    pageErrors.length === 0 ? pass('no uncaught page errors') : fail(pageErrors.join(' | '))
  },
})

if (
  cleanupReport === null ||
  !cleanupReport.pageClosed ||
  !cleanupReport.browserClosed ||
  !cleanupReport.serverExited ||
  !cleanupReport.portReusable
) {
  fail(`owned cleanup failed: ${JSON.stringify(cleanupReport)}`)
} else if (cleanupReport.artifactCleanup?.kept) {
  pass(`owned artifacts kept (KEEP_ARTIFACTS); port ${PORT} reusable`)
} else if (cleanupReport.artifactCleanup?.kept === false) {
  pass(`owned artifacts removed; port ${PORT} reusable`)
  if (await exists(OUT)) fail(`owned artifact dir still present: ${OUT}`)
  else pass(`confirmed ${OUT} removed from disk`)
} else {
  fail(`artifact cleanup missing: ${JSON.stringify(cleanupReport.artifactCleanup)}`)
}

if (failures.length > 0) {
  console.error(`\n${failures.length} m10-occlusion-readability gate failure(s)`)
  process.exit(1)
}
console.log('\nM10 occlusion-readability gate PASS')
