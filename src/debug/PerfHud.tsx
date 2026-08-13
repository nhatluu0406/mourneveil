import { useEffect, useState } from 'react'
import { readMotionTelemetry } from './motionTelemetry'

interface PerfHudProps {
  readonly visible: boolean
}

export function PerfHud({ visible }: PerfHudProps) {
  const [text, setText] = useState('— FPS')

  useEffect(() => {
    if (!visible) return
    const id = window.setInterval(() => {
      const summary = readMotionTelemetry()
      if (summary === null) return
      const fps = summary.frames.fps.toFixed(0)
      const p95 = summary.frames.p95Ms.toFixed(1)
      const calls = summary.renderer.drawCalls
      const tris = summary.renderer.triangles
      setText(`${fps} FPS\n${p95} ms p95\n${calls} calls\n${Math.round(tris / 1000)}k tris`)
    }, 250)
    return () => window.clearInterval(id)
  }, [visible])

  if (!visible) return null

  return (
    <aside className="perf-hud" aria-label="Frame pacing">
      <pre>{text}</pre>
    </aside>
  )
}
