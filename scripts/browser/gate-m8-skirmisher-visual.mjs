import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m8-skirmisher-proof'
const failures = []
const pass = (message) => console.log(`OK: ${message}`)
const fail = (message) => {
  failures.push(message)
  console.error(`FAIL: ${message}`)
}

async function gate(page, method, ...args) {
  return page.evaluate(
    ({ method, args }) => window.__MOURNEVEIL_GATE__[method](...args),
    { method, args },
  )
}

await runOwnedBrowserGate({
  artifactDir: OUT,
  run: async (page, { baseUrl }) => {
    const errors = []
    const assetFailures = []
    page.on('pageerror', (error) => errors.push(String(error)))
    page.on('console', (message) => {
      const text = message.text()
      if (/failed to load|useGLTF|THREE\.GLTFLoader|404.*assets|missing runtime animation clip/i.test(text)) {
        assetFailures.push(text)
      }
    })
    await page.goto(`${baseUrl}?assetProof=enemy.skirmisher.proof`, { waitUntil: 'load' })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await page.waitForTimeout(900)

    const glbOk = await page.evaluate(async () => {
      const response = await fetch('/assets/enemies/skirmisher/skirmisher-proof.glb')
      return response.ok && Number(response.headers.get('content-length') ?? '0') > 1000
    })
    glbOk ? pass('isolated skirmisher proof GLB reachable') : fail('proof GLB unreachable')

    const state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    const skirmisher = state.enemies.find(
      (enemy) => enemy.definitionId === 'enemy.skirmisher.graybox',
    )
    if (!skirmisher) {
      fail('skirmisher fixture runtime missing')
      return
    }
    await gate(page, 'setPlayerPosition', {
      x: skirmisher.position.x - 0.9,
      y: 0.82,
      z: skirmisher.position.z,
    })
    await page.waitForTimeout(1_000)
    await page.screenshot({ path: `${OUT}/01-proof-attack.png` })
    const active = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    const projected = active.enemies.find((enemy) => enemy.id === skirmisher.id)
    projected?.alive && (projected.state === 'attack' || projected.action.phase !== 'idle')
      ? pass(`proof fixture consumes enemy phase=${projected.action.phase}`)
      : fail(`proof fixture phase unavailable: ${projected?.action?.phase}`)

    await gate(page, 'defeatEnemy', skirmisher.id)
    await page.waitForTimeout(350)
    await page.screenshot({ path: `${OUT}/02-proof-defeated.png` })
    const defeated = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    defeated.enemies.find((enemy) => enemy.id === skirmisher.id)?.alive === false
      ? pass('proof fixture projects defeated runtime')
      : fail('proof fixture defeat regression')

    assetFailures.length === 0 ? pass('no proof asset failures') : fail(assetFailures.join(' | '))
    errors.length === 0 ? pass('no uncaught page errors') : fail(errors.join(' | '))
  },
})

if (failures.length > 0) {
  throw new Error(`${failures.length} skirmisher proof gate failure(s)\n${failures.join('\n')}`)
}
console.log('Skirmisher proof gate PASS')
