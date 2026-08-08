export function PlayerVisual() {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.35, 0.9, 8, 16]} />
        <meshStandardMaterial color="#d2a36a" roughness={0.62} metalness={0.04} />
      </mesh>
      <mesh castShadow position={[0, 0.55, -0.28]}>
        <boxGeometry args={[0.18, 0.14, 0.36]} />
        <meshStandardMaterial color="#f3ead7" roughness={0.5} />
      </mesh>
    </group>
  )
}
