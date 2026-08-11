import { spawn } from 'node:child_process'
import { rm, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const VITE_CLI = fileURLToPath(new URL('../../node_modules/vite/bin/vite.js', import.meta.url))
const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 4173
const START_TIMEOUT_MS = 30_000
const STOP_TIMEOUT_MS = 3_000
const OWNED_ARTIFACT_NAME = /^tmp-m[\w.-]+$/i

export function shouldKeepGateArtifacts(env = process.env) {
  return env.KEEP_ARTIFACTS === '1' || env.KEEP_ARTIFACTS === 'true'
}

/**
 * Prepare a gate-owned evidence directory under cwd.
 * Only `tmp-m*` basenames are allowed so cleanup cannot touch arbitrary paths.
 */
export async function prepareOwnedArtifactDir(
  relativeDir,
  { cwd = process.cwd(), env = process.env } = {},
) {
  if (typeof relativeDir !== 'string' || relativeDir.length === 0) {
    throw new TypeError('prepareOwnedArtifactDir requires a relative directory')
  }
  const root = path.resolve(cwd)
  const resolved = path.resolve(cwd, relativeDir)
  const relative = path.relative(root, resolved)
  if (
    relative === '' ||
    relative.startsWith('..') ||
    path.isAbsolute(relative) ||
    relative.split(/[/\\]/).length !== 1
  ) {
    throw new Error(`artifact dir must be a single cwd-owned folder: ${relativeDir}`)
  }
  if (!OWNED_ARTIFACT_NAME.test(path.basename(resolved))) {
    throw new Error(`artifact dir basename must match tmp-m*: ${path.basename(resolved)}`)
  }
  await mkdir(resolved, { recursive: true })
  return {
    path: resolved,
    async cleanup() {
      if (shouldKeepGateArtifacts(env)) {
        return { kept: true, path: resolved }
      }
      await rm(resolved, { recursive: true, force: true })
      return { kept: false, path: resolved }
    },
  }
}

export async function runOwnedBrowserGate({
  run,
  cwd = process.cwd(),
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  headless = true,
  viewport = { width: 1440, height: 900 },
  artifactDir = null,
  afterCleanup,
}) {
  if (typeof run !== 'function') throw new TypeError('runOwnedBrowserGate requires run(page)')
  const output = []
  const artifacts =
    artifactDir === null || artifactDir === undefined
      ? null
      : await prepareOwnedArtifactDir(artifactDir, { cwd })
  const server = spawnOwnedVite({ cwd, host, port, output })
  let browser = null
  let context = null
  let page = null
  let cleanupPromise = null

  const cleanup = () => {
    cleanupPromise ??= (async () => {
      await closeQuietly(page)
      await closeQuietly(context)
      await closeQuietly(browser)
      await stopOwnedProcessTree(server)
      let artifactCleanup = null
      if (artifacts !== null) {
        artifactCleanup = await artifacts.cleanup()
      }
      const report = {
        pageClosed: page === null || page.isClosed(),
        browserClosed: browser === null || !browser.isConnected(),
        serverExited: server.exitCode !== null || server.signalCode !== null,
        portReusable: await canBindPort(port, host),
        artifactCleanup,
      }
      if (afterCleanup) await afterCleanup(report)
      return report
    })()
    return cleanupPromise
  }

  const removeSignalHandlers = installSignalCleanup(cleanup)
  try {
    await waitForHttp(`http://${host}:${port}/`, server, output)
    browser = await chromium.launch({ headless })
    context = await browser.newContext({ viewport })
    page = await context.newPage()
    return await run(page, {
      baseUrl: `http://${host}:${port}/`,
      browser,
      context,
      serverPid: server.pid,
      artifactDir: artifacts?.path ?? null,
    })
  } finally {
    removeSignalHandlers()
    await cleanup()
  }
}

export function spawnOwnedVite({ cwd, host = DEFAULT_HOST, port = DEFAULT_PORT, output = [] }) {
  const child = spawn(
    process.execPath,
    [VITE_CLI, '--host', host, '--port', String(port), '--strictPort'],
    {
      cwd,
      detached: process.platform !== 'win32',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  collectOutput(child.stdout, output)
  collectOutput(child.stderr, output)
  return child
}

export async function stopOwnedProcessTree(child, timeoutMs = STOP_TIMEOUT_MS) {
  if (child.exitCode !== null || child.signalCode !== null) return
  const pid = child.pid
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('owned child has no valid PID')

  if (process.platform === 'win32') {
    signalOwnedChild(child, 'SIGTERM')
  } else {
    signalOwnedPosixProcessGroup(pid, 'SIGTERM')
  }
  if (await waitForExit(child, timeoutMs)) return

  if (process.platform === 'win32') {
    await runTaskkill(pid)
  } else {
    signalOwnedPosixProcessGroup(pid, 'SIGKILL')
  }
  if (!(await waitForExit(child, timeoutMs))) {
    throw new Error(`owned process tree ${pid} did not terminate`)
  }
}

export function signalOwnedPosixProcessGroup(pid, signal, killProcess = process.kill) {
  try {
    killProcess(-pid, signal)
    return true
  } catch (error) {
    if (isMissingProcessError(error)) return false
    throw error
  }
}

export async function canBindPort(port, host = DEFAULT_HOST) {
  return new Promise((resolve) => {
    const server = createServer()
    server.unref()
    server.once('error', () => resolve(false))
    server.listen(port, host, () => server.close(() => resolve(true)))
  })
}

export async function waitForHttp(url, child, output = [], timeoutMs = START_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`runtime server exited before ready\n${output.slice(-20).join('')}`)
    }
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Server is still starting.
    }
    await delay(100)
  }
  throw new Error(`runtime server timed out at ${url}\n${output.slice(-20).join('')}`)
}

function collectOutput(stream, output) {
  stream?.setEncoding('utf8')
  stream?.on('data', (chunk) => {
    output.push(chunk)
    if (output.length > 100) output.splice(0, output.length - 100)
  })
}

async function closeQuietly(resource) {
  if (resource === null) return
  try {
    await resource.close()
  } catch {
    // Idempotent teardown: continue closing the remaining owned resources.
  }
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true)
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.off('exit', onExit)
      resolve(false)
    }, timeoutMs)
    const onExit = () => {
      clearTimeout(timer)
      resolve(true)
    }
    child.once('exit', onExit)
  })
}

function signalOwnedChild(child, signal) {
  try {
    return child.kill(signal)
  } catch (error) {
    if (isMissingProcessError(error)) return false
    throw error
  }
}

function isMissingProcessError(error) {
  return error !== null && typeof error === 'object' && error.code === 'ESRCH'
}

function runTaskkill(pid) {
  return new Promise((resolve, reject) => {
    const killer = spawn('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    })
    killer.once('error', reject)
    killer.once('exit', (code) => {
      if (code === 0 || code === 128) resolve()
      else reject(new Error(`scoped taskkill failed for owned PID ${pid} (exit ${code})`))
    })
  })
}

function installSignalCleanup(cleanup) {
  const handlers = new Map()
  for (const [signal, exitCode] of [
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ]) {
    const handler = () => {
      void cleanup().finally(() => {
        process.exitCode = exitCode
      })
    }
    handlers.set(signal, handler)
    process.once(signal, handler)
  }
  return () => {
    for (const [signal, handler] of handlers) process.off(signal, handler)
  }
}
