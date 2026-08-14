import { defineObject } from '../defineObject'

export const VeilLamp = defineObject({
  id: 'ossuary.light.veil-lamp',
  family: 'lighting',
  materialKey: 'verdigris',
  castShadow: false,
  receiveShadow: false,
  renderMode: 'instanced',
  anchorPolicy: 'floor',
  lighting: { kind: 'actual' },
  tags: ['lighting'],
})
