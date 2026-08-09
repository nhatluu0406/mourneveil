/**
 * Final M4 end-to-end browser playthrough (compressed, gate-assisted where needed).
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
      checkpoint: s.checkpoint,
      flask: s.flask.currentCharges,
      echoes: s.echoes.carried,
      recovery: s.echoRecovery,
      inventory: s.inventory.entries,
      equipment: s.equipment,
      dmg: s.resolvedAttackDamage,
      maxHp: s.playerHealth.health.maximum,
      hp: s.playerHealth.health.current,
      life: s.playerHealth.lifeState,
      combat: s.combat.phase,
      loot: s.lootPickup,
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

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.removeItem('mourneveil.save.v1')
    localStorage.removeItem('mourneveil.save.v2')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // spawn → checkpoint
  await press(page, 'KeyF')
  await page.waitForTimeout(150)
  let s = await snap(page)
  if (s.checkpoint.activated) ok('activate checkpoint')
  else fail('checkpoint')

  // take damage + flask
  await gate(page, 'applyDamage', 40)
  await press(page, 'KeyE')
  await page.waitForTimeout(800)
  s = await snap(page)
  if (s.hp > 60 && s.flask === 2) ok('flask heal after damage')
  else fail(`flask hp=${s.hp} charges=${s.flask}`)

  // fight: defeat both, gain echoes + loot
  await gate(page, 'defeatEnemy', 'enemy.skirmisher.1')
  await page.waitForTimeout(80)
  s = await snap(page)
  await gate(page, 'setPlayerPosition', { x: s.loot.position.x, y: 0.82, z: s.loot.position.z })
  await page.waitForTimeout(250)
  await gate(page, 'equipItem', 'item.weapon.oathblade')
  await gate(page, 'defeatEnemy', 'enemy.brute.1')
  await page.waitForTimeout(80)
  s = await snap(page)
  await gate(page, 'setPlayerPosition', { x: s.loot.position.x, y: 0.82, z: s.loot.position.z })
  await page.waitForTimeout(250)
  await gate(page, 'equipItem', 'item.charm.vitality')
  s = await snap(page)
  if (s.echoes === 85 && s.dmg.light === 28 && s.maxHp === 120) ok('echoes + equip modifiers')
  else fail(`loop mid ${JSON.stringify({ e: s.echoes, d: s.dmg, m: s.maxHp })}`)

  // die → drop → respawn → recover
  await gate(page, 'setPlayerPosition', { x: 2.5, y: 0.82, z: -2.5 })
  await gate(page, 'applyDamage', 999)
  await page.waitForTimeout(150)
  s = await snap(page)
  if (s.life === 'dead' && s.echoes === 0 && s.recovery.active) ok('death drop')
  else fail('death drop')
  await press(page, 'KeyR')
  await page.waitForTimeout(300)
  s = await snap(page)
  await gate(page, 'setPlayerPosition', {
    x: s.recovery.position.x,
    y: 0.82,
    z: s.recovery.position.z,
  })
  await page.waitForTimeout(250)
  s = await snap(page)
  if (!s.recovery.active && s.echoes === 85) ok('recover echoes')
  else fail(`recover ${s.echoes} active=${s.recovery.active}`)

  // reload persistence
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  s = await snap(page)
  if (
    s.checkpoint.activated &&
    s.echoes === 85 &&
    s.equipment.weaponItemId === 'item.weapon.oathblade' &&
    s.equipment.charmItemId === 'item.charm.vitality' &&
    s.combat === 'idle' &&
    s.life === 'alive'
  ) {
    ok('reload restored persistent M4 state')
  } else fail(`reload ${JSON.stringify(s)}`)

  // UI isolation
  await page.getByRole('button', { name: 'Reset training target' }).click()
  await page.waitForTimeout(100)
  if ((await snap(page)).combat === 'idle') ok('UI no combat')
  else fail('UI combat')

  if (errors.length) fail(errors.join('|'))
  else ok('no console errors')

  await browser.close()
  console.log('\n=== M4 E2E SUMMARY ===')
  console.log('passed:', notes.length, 'failures:', failures.length)
  for (const f of failures) console.log(' -', f)
  if (failures.length) process.exit(1)
  console.log('VERDICT: PASS')
}

main().catch((e) => { console.error(e); process.exit(1) })
