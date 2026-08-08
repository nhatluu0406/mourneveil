export function PlayerVisual() {
  return (
    <mesh castShadow receiveShadow>
      <capsuleGeometry args={[0.35, 0.9, 8, 16]} />
      <meshStandardMaterial color="#b9c7bb" roughness={0.72} />
    </mesh>
  )
}
