import { defineObject } from '../defineObject'

export const CandleCluster = defineObject({
  id: 'ossuary.light.candle-cluster',
  family: 'lighting',
  materialKey: 'bone',
  castShadow: false,
  receiveShadow: false,
  renderMode: 'unique',
  anchorPolicy: 'floor',
  lighting: { kind: 'emissive' },
  tags: ['lighting'],
})
