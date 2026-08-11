import { spawn } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import {
  canBindPort,
  stopOwnedProcessTree,
  waitForHttp,
} from './runtimeGateLifecycle.mjs'

const HOST = '127.0.0.1'
const PORT = 4193

describe('owned runtime gate lifecycle', () => {
  it('terminates only its child and makes the port reusable', async () => {
    expect(await canBindPort(PORT, HOST)).toBe(true)
    const script = [
      "const http=require('node:http')",
      `http.createServer((_,res)=>res.end('ok')).listen(${PORT},'${HOST}')`,
    ].join(';')
    const child = spawn(process.execPath, ['-e', script], {
      windowsHide: true,
      stdio: 'ignore',
    })
    try {
      await waitForHttp(`http://${HOST}:${PORT}/`, child, [], 5_000)
      expect(await canBindPort(PORT, HOST)).toBe(false)
    } finally {
      await stopOwnedProcessTree(child)
    }
    expect(child.exitCode !== null || child.signalCode !== null).toBe(true)
    expect(await canBindPort(PORT, HOST)).toBe(true)
  })
})
