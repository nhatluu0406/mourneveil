/**
 * M4.4 browser gate — Echo reward / death drop / recovery.
 */
import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:4173/'
const failures = []
const notes = []
function fail(m) { failures.push(m); console.error('FAIL:', m) }
function ok(m) { notes.push(m); console.log('OK:', m) }

async function snap(page) {
  return page.evaluate(() => {
    const s = window.__MOURNEVEIL_GATE__.snapshot()
    return {
      echoes: s.echoes.carried,
      recovery: s.echoRecovery,
      life: s.playerHealth.lifeState,
      hp: s.playerHealth.health.current,
      enemies: s.enemies.map((e) => ({ id: e.id, alive: e.alive, hp: e.health.current })),
      position: s.player.position,
      step: s.simulation.stepCount,
    }
  })
}

async function gate(page, method, arg) {
  return page.evaluate(({ method, arg }) => window.__MOURNEVEIL_GATE__[method](arg), { method, arg })
}

async function press(page, code) {
  await page.evaluate((code) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }))
  }, code)
}

async function waitFor(page, pred, ms, label) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    const s = await snap(page)
    if (pred(s)) return s
    await page.waitForTimeout(100)
  }
  fail(`timeout ${label}`)
  return snap(page)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  if (!(await page.evaluate(() => !!window.__MOURNEVEIL_GATE__))) fail('gate missing')

  await press(page, 'KeyF')
  await page.waitForTimeout(200)

  // Prove reward path via authoritative defeat helper (same grantEchoRewardsForDefeatedEnemies as combat hits).
  await gate(page, 'defeatEnemy', 'enemy.skirmisher.1')
  let s = await waitFor(page, (x) => x.echoes === 25, 2000, 'skirmisher reward')
  if (s.echoes === 25) ok('skirmisher defeat rewarded 25 Echoes')
  else fail(`skirmisher reward ${s.echoes}`)

  await gate(page, 'defeatEnemy', 'enemy.brute.1')
  s = await waitFor(page, (x) => x.echoes === 85, 2000, 'brute reward')
  if (s.echoes === 85) ok('brute defeat rewarded +60 Echoes (total 85)')
  else fail(`brute reward ${s.echoes}`)

  // Duplicate defeat must not add again
  await gate(page, 'defeatEnemy', 'enemy.skirmisher.1')
  await page.waitForTimeout(100)
  if ((await snap(page)).echoes === 85) ok('duplicate dead enemy did not re-reward')
  else fail('duplicate reward')

  const earned = 85
  // Die away from checkpoint so respawn does not instantly re-pickup the drop.
  await gate(page, 'setPlayerPosition', { x: 2.5, y: 0.82, z: -2.5 })
  await gate(page, 'applyDamage', 999)
  s = await waitFor(page, (x) => x.life === 'dead', 2000, 'death')
  if (s.echoes === 0 && s.recovery.active && s.recovery.amount === earned) {
    ok(`death dropped ${earned} Echoes into recovery`)
  } else fail(`drop mismatch echoes=${s.echoes} recovery=${JSON.stringify(s.recovery)} earned=${earned}`)

  await press(page, 'KeyR')
  s = await waitFor(page, (x) => x.life === 'alive' && x.echoes === 0 && x.recovery.active, 3000, 'respawn')
  if (s.echoes === 0 && s.recovery.active) ok('respawn kept recovery, carried=0')
  else fail(`respawn corrupted recovery/carried echoes=${s.echoes} active=${s.recovery.active}`)

  // Walk/teleport near recovery then let proximity claim
  const target = s.recovery.position
  await gate(page, 'setPlayerPosition', {
    x: target.x + 0.4,
    y: 0.82,
    z: target.z + 0.4,
  })
  s = await waitFor(page, (x) => !x.recovery.active && x.echoes === earned, 3000, 'recovery pickup')
  if (!s.recovery.active && s.echoes === earned) ok(`recovered ${earned} Echoes`)
  else fail(`recovery failed echoes=${s.echoes} active=${s.recovery.active}`)

  // Second death replaces recovery
  await gate(page, 'setPlayerPosition', { x: 2.5, y: 0.82, z: -2.5 })
  await gate(page, 'applyDamage', 999)
  s = await waitFor(page, (x) => x.life === 'dead', 2000, 'second death')
  if (s.echoes === 0 && s.recovery.active && s.recovery.amount === earned) {
    ok('second death replaced recovery with current carried')
  } else fail(`second death policy mismatch ${JSON.stringify(s)}`)

  await press(page, 'KeyR')
  s = await waitFor(page, (x) => x.life === 'alive' && x.recovery.active && x.echoes === 0, 3000, 'respawn2')
  // Die with 0 carried at checkpoint → clears prior recovery without creating new
  await gate(page, 'applyDamage', 999)
  s = await waitFor(page, (x) => x.life === 'dead', 2000, 'zero death')
  if (!s.recovery.active && s.echoes === 0) ok('zero-carried death clears prior recovery')
  else fail(`zero death did not clear recovery ${JSON.stringify(s.recovery)} echoes=${s.echoes}`)

  if (errors.length) fail(`console: ${errors.join(' | ')}`)
  else ok('no console errors')

  await browser.close()
  console.log('\n=== M4.4 BROWSER SUMMARY ===')
  console.log('passed:', notes.length, 'failures:', failures.length)
  for (const f of failures) console.log(' -', f)
  if (failures.length) process.exit(1)
  console.log('VERDICT: PASS')
}

main().catch((e) => { console.error(e); process.exit(1) })
