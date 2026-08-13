import { defineObject } from '../defineObject'

export const VeilLamp = defineObject({
  id: 'ossuary.light.veil-lamp',
  family: 'lighting',
  materialKey: 'verdigris',
  castShadow: true,
  receiveShadow: false,
  renderMode: 'unique',
  anchorPolicy: 'floor',
  lighting: { kind: 'actual' },
  tags: ['lighting'],
})
