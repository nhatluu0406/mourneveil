import { describe, expect, it } from 'vitest'

const roomSources = import.meta.glob('./dungeons/ossuary/rooms/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('dungeon room authoring law', () => {
  it('does not create meshes, point lights, or cuboid colliders in room modules', () => {
    const files = Object.entries(roomSources)
    expect(files.length).toBeGreaterThanOrEqual(8)
    for (const [path, source] of files) {
      expect(source, path).not.toMatch(/<mesh[\s>]/)
      expect(source, path).not.toMatch(/<pointLight[\s>]/)
      expect(source, path).not.toMatch(/<CuboidCollider[\s>]/)
      expect(source, path).not.toMatch(/from 'react'/)
      expect(source, path).not.toMatch(/@react-three\/rapier/)
    }
  })
})
