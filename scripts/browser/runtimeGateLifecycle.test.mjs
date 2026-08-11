import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { access, constants, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  canBindPort,
  prepareOwnedArtifactDir,
  shouldKeepGateArtifacts,
  signalOwnedPosixProcessGroup,
  stopOwnedProcessTree,
  waitForHttp,
} from './runtimeGateLifecycle.mjs'

const HOST = '127.0.0.1'
const RUNNING_PORT = 4193
const EXITED_PORT = 4194

describe('owned runtime gate lifecycle', () => {
  it('terminates only its child and makes the port reusable', async () => {
    expect(await canBindPort(RUNNING_PORT, HOST)).toBe(true)
    const script = [
      "const http=require('node:http')",
      `http.createServer((_,res)=>res.end('ok')).listen(${RUNNING_PORT},'${HOST}')`,
    ].join(';')
    const child = spawn(process.execPath, ['-e', script], {
      detached: process.platform !== 'win32',
      windowsHide: true,
      stdio: 'ignore',
    })
    try {
      await waitForHttp(`http://${HOST}:${RUNNING_PORT}/`, child, [], 5_000)
      expect(await canBindPort(RUNNING_PORT, HOST)).toBe(false)
    } finally {
      await stopOwnedProcessTree(child)
    }
    expect(child.exitCode !== null || child.signalCode !== null).toBe(true)
    expect(await canBindPort(RUNNING_PORT, HOST)).toBe(true)
  })

  it('accepts an already-exited child and repeated cleanup', async () => {
    expect(await canBindPort(EXITED_PORT, HOST)).toBe(true)
    const child = spawn(process.execPath, ['-e', 'process.exit(0)'], {
      detached: process.platform !== 'win32',
      windowsHide: true,
      stdio: 'ignore',
    })
    await once(child, 'exit')
    await expect(stopOwnedProcessTree(child)).resolves.toBeUndefined()
    await expect(stopOwnedProcessTree(child)).resolves.toBeUndefined()
    expect(await canBindPort(EXITED_PORT, HOST)).toBe(true)
  })

  it('treats ESRCH from a raced POSIX group signal as already gone', () => {
    const missingGroup = Object.assign(new Error('kill ESRCH'), { code: 'ESRCH' })
    expect(
      signalOwnedPosixProcessGroup(12345, 'SIGTERM', () => {
        throw missingGroup
      }),
    ).toBe(false)
  })

  it('does not swallow unexpected POSIX group signal errors', () => {
    const denied = Object.assign(new Error('kill EPERM'), { code: 'EPERM' })
    expect(() =>
      signalOwnedPosixProcessGroup(12345, 'SIGTERM', () => {
        throw denied
      }),
    ).toThrow(denied)
  })

  it('prepares and removes owned tmp-m artifact dirs by default', async () => {
    const owned = await prepareOwnedArtifactDir('tmp-m-lifecycle-test', {
      env: { KEEP_ARTIFACTS: '0' },
    })
    await writeFile(path.join(owned.path, 'probe.txt'), 'ok', 'utf8')
    expect(await access(owned.path, constants.F_OK).then(() => true)).toBe(true)
    const cleanup = await owned.cleanup()
    expect(cleanup).toEqual({ kept: false, path: owned.path })
    await expect(access(owned.path, constants.F_OK)).rejects.toBeTruthy()
  })

  it('keeps owned artifacts when KEEP_ARTIFACTS is set', async () => {
    expect(shouldKeepGateArtifacts({ KEEP_ARTIFACTS: '1' })).toBe(true)
    const owned = await prepareOwnedArtifactDir('tmp-m-lifecycle-keep', {
      env: { KEEP_ARTIFACTS: '1' },
    })
    const cleanup = await owned.cleanup()
    expect(cleanup.kept).toBe(true)
    await access(owned.path, constants.F_OK)
    const { rm } = await import('node:fs/promises')
    await rm(owned.path, { recursive: true, force: true })
  })

  it('rejects artifact paths outside a single cwd-owned tmp-m folder', async () => {
    await expect(prepareOwnedArtifactDir('../tmp-m-escape')).rejects.toThrow(/cwd-owned/)
    await expect(prepareOwnedArtifactDir('not-tmp')).rejects.toThrow(/tmp-m/)
  })
})
