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
      life: s.playerHealth.lifeState,
      combat: s.combat.phase,
      enemiesAlive: s.enemies.every((e) => e.alive),
    }
  })
}

async function gate(page, method, arg) {
  return page.evaluate(({ method, arg }) => window.__MOURNEVEIL_GATE__[method](arg), {
    method,
    arg,
  })
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

  // Clear any prior save
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('mourneveil.save.v1'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  await press(page, 'KeyF')
  await page.waitForTimeout(200)
  await gate(page, 'defeatEnemy', 'enemy.skirmisher.1')
  await page.waitForTimeout(100)
  let s = await snap(page)
  const lootPos = s.recovery // wrong - need loot from snapshot
  const loot = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot().lootPickup)
  await gate(page, 'setPlayerPosition', { x: loot.position.x, y: 0.82, z: loot.position.z })
  await page.waitForTimeout(300)
  await gate(page, 'equipItem', 'item.weapon.oathblade')
  await gate(page, 'defeatEnemy', 'enemy.brute.1')
  await page.waitForTimeout(100)
  const charmLoot = await page.evaluate(() => window.__MOURNEVEIL_GATE__.snapshot().lootPickup)
  await gate(page, 'setPlayerPosition', {
    x: charmLoot.position.x,
    y: 0.82,
    z: charmLoot.position.z,
  })
  await page.waitForTimeout(300)
  await gate(page, 'equipItem', 'item.charm.vitality')
  await gate(page, 'applyDamage', 40)
  await press(page, 'KeyE')
  await page.waitForTimeout(900)
  await gate(page, 'setPlayerPosition', { x: 2.5, y: 0.82, z: -2.5 })
  await gate(page, 'applyDamage', 999)
  await page.waitForTimeout(200)
  s = await snap(page)
  if (!s.recovery.active) fail('expected active recovery before reload')
  else ok(`pre-reload recovery=${s.recovery.amount} echoes=${s.echoes}`)

  const before = await snap(page)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  s = await snap(page)

  if (s.checkpoint.activated && s.checkpoint.currentCheckpointId === 'checkpoint.graybox.entry') {
    ok('checkpoint restored')
  } else fail(`checkpoint ${JSON.stringify(s.checkpoint)}`)
  if (s.echoes === before.echoes) ok(`echoes restored (${s.echoes})`)
  else fail(`echoes ${s.echoes} vs ${before.echoes}`)
  if (s.recovery.active && s.recovery.amount === before.recovery.amount) ok('recovery restored')
  else fail(`recovery ${JSON.stringify(s.recovery)}`)
  if (s.equipment.weaponItemId === 'item.weapon.oathblade') ok('weapon restored')
  else fail(`weapon ${s.equipment.weaponItemId}`)
  if (s.equipment.charmItemId === 'item.charm.vitality') ok('charm restored')
  else fail(`charm ${s.equipment.charmItemId}`)
  if (s.dmg.light === 28 && s.maxHp === 120) ok('modifiers restored')
  else fail(`mods dmg=${JSON.stringify(s.dmg)} max=${s.maxHp}`)
  if (s.life === 'alive' && s.combat === 'idle') ok('idle stable load state')
  else fail(`life/combat ${s.life}/${s.combat}`)
  if (s.enemiesAlive) ok('encounter enemies reset on load')
  else fail('enemies not reset')
  if (s.flask < 3) ok(`flask charges persisted (${s.flask})`)
  else notes.push(`flask full after reload (${s.flask})`)

  if (errors.length) fail(errors.join(' | '))
  else ok('no console errors')

  await browser.close()
  console.log('\n=== M4.6 RELOAD SUMMARY ===')
  console.log('passed:', notes.length, 'failures:', failures.length)
  for (const f of failures) console.log(' -', f)
  if (failures.length) process.exit(1)
  console.log('VERDICT: PASS')
}

main().catch((e) => { console.error(e); process.exit(1) })
