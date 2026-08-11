import { chromium } from 'playwright'

const trackedBrowsers = new Set()
let fatalCleanupStarted = false

export async function launchGateChromium(options) {
  const browser = await chromium.launch(options)
  return trackGateBrowser(browser)
}

export function trackGateBrowser(browser) {
  trackedBrowsers.add(browser)
  browser.once('disconnected', () => trackedBrowsers.delete(browser))
  return browser
}

export async function closeTrackedGateBrowsers() {
  const browsers = [...trackedBrowsers]
  trackedBrowsers.clear()
  await Promise.allSettled(browsers.map((browser) => browser.close()))
}

async function fatalCleanup(error, exitCode) {
  if (fatalCleanupStarted) return
  fatalCleanupStarted = true
  if (error !== null) console.error(error)
  await closeTrackedGateBrowsers()
  process.exit(exitCode)
}

process.once('uncaughtException', (error) => {
  void fatalCleanup(error, 1)
})
process.once('unhandledRejection', (reason) => {
  void fatalCleanup(reason, 1)
})
process.once('SIGINT', () => {
  void fatalCleanup(null, 130)
})
process.once('SIGTERM', () => {
  void fatalCleanup(null, 143)
})
