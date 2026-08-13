export const CANONICAL_SAVE_KEYS = [
  'mourneveil.save.v4',
  'mourneveil.save.v3',
  'mourneveil.save.v2',
  'mourneveil.save.v1',
]

/** Append `fresh=1` so gates skip the title screen and construct a new rite. */
export function withFreshQuery(baseUrl, extraSearch = '') {
  const url = new URL(baseUrl)
  if (extraSearch) {
    const extra = extraSearch.startsWith('?') ? extraSearch.slice(1) : extraSearch
    new URLSearchParams(extra).forEach((value, key) => {
      url.searchParams.set(key, value)
    })
  }
  url.searchParams.set('fresh', '1')
  return url.toString()
}

export async function clearCanonicalSaves(page) {
  await page.evaluate((keys) => {
    for (const key of keys) localStorage.removeItem(key)
  }, CANONICAL_SAVE_KEYS)
}

/** Reload/navigate without `fresh=1`, then Continue if the title screen appears. */
export async function continueExistingSession(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: 'load' })
  const continueButton = page.locator('[data-title-action="continue"]')
  if ((await continueButton.count()) > 0) {
    await continueButton.click()
  }
  await page.waitForSelector('canvas', { timeout: 30_000 })
  await page.waitForFunction(() => Boolean(window.__MOURNEVEIL_GATE__), null, {
    timeout: 30_000,
  })
}
