import { mkdir } from 'node:fs/promises'
import { runOwnedBrowserGate } from './runtimeGateLifecycle.mjs'

const OUT = 'tmp-m8-shrine'
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

await mkdir(OUT, { recursive: true })
await runOwnedBrowserGate({
  run: async (page, { baseUrl }) => {
    const errors = []
    const assetFailures = []
    page.on('pageerror', (error) => errors.push(String(error)))
    page.on('console', (message) => {
      const text = message.text()
      if (/failed to load|useGLTF|THREE\.GLTFLoader|404.*assets/i.test(text)) assetFailures.push(text)
    })
    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
      timeout: 30_000,
    })
    await page.evaluate(() => {
      localStorage.removeItem('mourneveil.save.v1')
      localStorage.removeItem('mourneveil.save.v2')
    })
    await page.reload({ waitUntil: 'load' })
    await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__))
    await page.waitForTimeout(700)

    let state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    const clearance = Math.hypot(
      state.player.position.x - state.checkpoint.visualPosition.x,
      state.player.position.z - state.checkpoint.visualPosition.z,
    )
    clearance >= 0.9 ? pass(`fresh spawn clearance=${clearance.toFixed(3)}`) : fail('spawn overlap')
    await page.screenshot({ path: `${OUT}/01-fresh.png` })

    await gate(page, 'setPlayerPosition', state.checkpoint.interactionPosition)
    await gate(page, 'interactCheckpoint')
    await gate(page, 'applyDamage', 999)
    await gate(page, 'respawn')
    await page.waitForTimeout(300)
    state = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot())
    state.checkpoint.activated && state.playerHealth.health.alive
      ? pass('rest and respawn valid')
      : fail('rest/respawn regression')
    await page.screenshot({ path: `${OUT}/02-respawn.png` })
    assetFailures.length === 0 ? pass('no shrine asset failures') : fail(assetFailures.join(' | '))
    errors.length === 0 ? pass('no uncaught page errors') : fail(errors.join(' | '))
  },
})

if (failures.length > 0) throw new Error(failures.join('\n'))
console.log('Shrine visual gate PASS')
