import { CircleGeometry, MeshBasicMaterial } from 'three'

const GROUNDING_GEOMETRY = new CircleGeometry(0.46, 20)
const GROUNDING_MATERIAL = new MeshBasicMaterial({
  color: '#050708',
  transparent: true,
  opacity: 0.34,
  depthWrite: false,
})

/** Cheap presentation-only contact patch used instead of a full-route dynamic shadow pass. */
export function ActorGroundingCue({ scale = 1 }: { readonly scale?: number }) {
  return (
    <mesh
      geometry={GROUNDING_GEOMETRY}
      material={GROUNDING_MATERIAL}
      position={[0, -0.765, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[scale, scale * 0.58, 1]}
      renderOrder={-1}
    />
  )
}
