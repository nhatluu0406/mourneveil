import { describe, expect, it } from 'vitest'
import {
  closeTrackedGateBrowsers,
  trackGateBrowser,
} from './trackedGateBrowser.mjs'

describe('historical gate browser tracking', () => {
  it('closes every tracked browser exactly once and is idempotent', async () => {
    let closeCount = 0
    let disconnected = null
    const browser = {
      once(event, callback) {
        if (event === 'disconnected') disconnected = callback
      },
      async close() {
        closeCount += 1
        disconnected?.()
      },
    }
    expect(trackGateBrowser(browser)).toBe(browser)
    await closeTrackedGateBrowsers()
    await closeTrackedGateBrowsers()
    expect(closeCount).toBe(1)
  })
})
