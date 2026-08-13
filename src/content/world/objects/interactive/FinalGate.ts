import { defineObject } from '../defineObject'

export const FinalGate = defineObject({
  id: 'ossuary.gate.final',
  family: 'interactive',
  materialKey: 'iron',
  castShadow: true,
  receiveShadow: false,
  renderMode: 'unique',
  occlusionPolicy: 'fade',
  anchorPolicy: 'structural',
  visualBounds: [0.5, 1.5, 2.9],
  collision: { kind: 'box', colliderKind: 'final-gate', navigationBlocking: true },
  interaction: { kind: 'gate' },
  tags: ['interactive', 'gate'],
})
