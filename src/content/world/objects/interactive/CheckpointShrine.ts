import { defineObject } from '../defineObject'

export const CheckpointShrine = defineObject({
  id: 'ossuary.interactive.checkpoint-shrine',
  family: 'interactive',
  materialKey: 'darkStone',
  castShadow: true,
  receiveShadow: true,
  renderMode: 'unique',
  anchorPolicy: 'floor',
  visualBounds: [0.8, 2.8, 0.8],
  collision: { kind: 'box', colliderKind: 'checkpoint', navigationBlocking: true },
  interaction: { kind: 'checkpoint' },
  tags: ['interactive', 'checkpoint'],
})
