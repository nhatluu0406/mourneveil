import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import type { Group } from 'three'

/** Light presentation-only drift for veil wisps. */
export function VeilWispMotion({ children }: { readonly children: ReactNode }) {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (group === null) return
    group.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.045
    group.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.025
  })

  return <group ref={groupRef}>{children}</group>
}
