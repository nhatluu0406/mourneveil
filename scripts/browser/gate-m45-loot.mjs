import { launchGateChromium } from './trackedGateBrowser.mjs'

const BASE = 'http://127.0.0.1:4173/'
const failures = []
const notes = []
function fail(m) { failures.push(m); console.error('FAIL:', m) }
function ok(m) { notes.push(m); console.log('OK:', m) }

async function snap(page) {
  return page.evaluate(() => {
    const s = window.__MOURNEVEIL_GATE__.snapshot()
    return {
      inventory: s.inventory.entries,
      equipment: s.equipment,
      loot: s.lootPickup,
      dmg: s.resolvedAttackDamage,
      maxHp: s.playerHealth.health.maximum,
      currentHp: s.playerHealth.health.current,
      combat: s.combat.phase,
    }
  })
}

async function gate(page, method, arg) {
  return page.evaluate(({ method, arg }) => window.__MOURNEVEIL_GATE__[method](arg), {
    method,
    arg,
  })
}

async function waitFor(page, pred, ms, label) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    const s = await snap(page)
    if (pred(s)) return s
    await page.waitForTimeout(80)
  }
  fail(`timeout ${label}`)
  return snap(page)
}

async function main() {
  const browser = await launchGateChromium({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  await gate(page, 'defeatEnemy', 'enemy.skirmisher.1')
  let s = await waitFor(page, (x) => x.loot.active && x.loot.itemId === 'item.weapon.oathblade', 2000, 'loot spawn')
  if (s.loot.active) ok('skirmisher loot spawned')
  else fail('loot missing')

  await gate(page, 'setPlayerPosition', {
    x: s.loot.position.x,
    y: 0.82,
    z: s.loot.position.z,
  })
  s = await waitFor(
    page,
    (x) => !x.loot.active && x.inventory.some((e) => e.itemId === 'item.weapon.oathblade'),
    3000,
    'loot pickup',
  )
  if (!s.loot.active) ok('loot picked into inventory')
  else fail('pickup failed')

  await gate(page, 'equipItem', 'item.weapon.oathblade')
  s = await snap(page)
  if (s.equipment.weaponItemId === 'item.weapon.oathblade' && s.dmg.light === 28 && s.dmg.heavy === 47) {
    ok('equipped oathblade damage 28/47')
  } else fail(`weapon equip ${JSON.stringify(s.dmg)} ${s.equipment.weaponItemId}`)

  await gate(page, 'defeatEnemy', 'enemy.brute.1')
  s = await waitFor(page, (x) => x.loot.active && x.loot.itemId === 'item.charm.vitality', 2000, 'charm loot')
  await gate(page, 'setPlayerPosition', { x: s.loot.position.x, y: 0.82, z: s.loot.position.z })
  s = await waitFor(
    page,
    (x) => x.inventory.some((e) => e.itemId === 'item.charm.vitality'),
    3000,
    'charm pickup',
  )
  await gate(page, 'equipItem', 'item.charm.vitality')
  s = await snap(page)
  if (s.maxHp === 120 && s.equipment.charmItemId === 'item.charm.vitality') ok('vitality charm max HP 120')
  else fail(`charm equip max=${s.maxHp}`)

  await gate(page, 'unequipSlot', 'weapon')
  await gate(page, 'unequipSlot', 'charm')
  s = await snap(page)
  if (s.dmg.light === 20 && s.dmg.heavy === 35 && s.maxHp === 100) ok('unequip restored baselines')
  else fail(`unequip ${JSON.stringify(s.dmg)} max=${s.maxHp}`)

  // UI click isolation
  await page.getByRole('button', { name: 'Equip' }).first().click()
  await page.waitForTimeout(200)
  s = await snap(page)
  if (s.combat === 'idle') ok('inventory Equip click did not start combat')
  else fail(`UI click combat ${s.combat}`)

  if (errors.length) fail(errors.join(' | '))
  else ok('no console errors')

  await browser.close()
  console.log('\n=== M4.5 BROWSER SUMMARY ===')
  console.log('passed:', notes.length, 'failures:', failures.length)
  for (const f of failures) console.log(' -', f)
  if (failures.length) process.exit(1)
  console.log('VERDICT: PASS')
}

main().catch((e) => { console.error(e); process.exit(1) })
