import { runOwnedBrowserGate, canBindPort } from './runtimeGateLifecycle.mjs'

const HOST = '127.0.0.1'
const SUCCESS_PORT = 4221
const FAILURE_PORT = 4222

async function assertReusable(port) {
  if (!(await canBindPort(port, HOST))) throw new Error(`port ${port} is not reusable`)
}

let successCleanup = null
await runOwnedBrowserGate({
  host: HOST,
  port: SUCCESS_PORT,
  afterCleanup: (report) => {
    successCleanup = report
  },
  run: async (page, { baseUrl }) => {
    const response = await page.goto(baseUrl, { waitUntil: 'load' })
    if (!response?.ok()) throw new Error('success gate did not load the runtime')
  },
})
await assertReusable(SUCCESS_PORT)
if (!successCleanup?.browserClosed || !successCleanup?.pageClosed || !successCleanup?.serverExited) {
  throw new Error(`success cleanup incomplete: ${JSON.stringify(successCleanup)}`)
}
console.log(`OK: success path closes page/browser/server and releases port ${SUCCESS_PORT}`)

let failureCleanup = null
let observedFailure = false
try {
  await runOwnedBrowserGate({
    host: HOST,
    port: FAILURE_PORT,
    afterCleanup: (report) => {
      failureCleanup = report
    },
    run: async (page, { baseUrl }) => {
      await page.goto(baseUrl, { waitUntil: 'load' })
      throw new Error('intentional lifecycle failure')
    },
  })
} catch (error) {
  observedFailure = error instanceof Error && error.message === 'intentional lifecycle failure'
}
await assertReusable(FAILURE_PORT)
if (
  !observedFailure ||
  !failureCleanup?.browserClosed ||
  !failureCleanup?.pageClosed ||
  !failureCleanup?.serverExited
) {
  throw new Error(`failure cleanup incomplete: ${JSON.stringify(failureCleanup)}`)
}
console.log(`OK: controlled failure closes page/browser/server and releases port ${FAILURE_PORT}`)
