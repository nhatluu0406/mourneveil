import { defineObject } from '../defineObject'

export const ShortcutGate = defineObject({
  id: 'ossuary.gate.shortcut',
  family: 'interactive',
  materialKey: 'iron',
  castShadow: true,
  receiveShadow: false,
  renderMode: 'unique',
  occlusionPolicy: 'fade',
  anchorPolicy: 'structural',
  visualBounds: [0.5, 1.5, 1.8],
  collision: { kind: 'box', colliderKind: 'shortcut-gate', navigationBlocking: true },
  interaction: { kind: 'gate' },
  tags: ['interactive', 'gate'],
})
