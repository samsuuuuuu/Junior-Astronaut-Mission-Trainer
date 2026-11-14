import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useGame } from '../game/store'

function Ground() {
  const craters = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + (i % 3)
        const r = 6 + ((i * 1.7) % 12)
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.8 + ((i * 37) % 10) / 6 }
      }),
    []
  )
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#8a8a92" roughness={1} />
      </mesh>
      {craters.map((c, i) => (
        <group key={i} position={[c.x, 0.02, c.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <circleGeometry args={[c.s, 32]} />
            <meshStandardMaterial color="#6d6d75" roughness={1} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <ringGeometry args={[c.s, c.s * 1.25, 32]} />
            <meshStandardMaterial color="#a3a3ab" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Habitat() {
  const shielding = useGame((s) => s.shielding)
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.6, 1.8, 24]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[3.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.05 + (shielding / 100) * 0.25}
          emissive="#38bdf8"
          emissiveIntensity={shielding / 150}
        />
      </mesh>
    </group>
  )
}

function SolarPanel({ position }) {
  const power = useGame((s) => s.power)
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <mesh position={[0, 1.1, 0]} rotation={[-0.6, 0, 0]} castShadow>
        <boxGeometry args={[2, 0.08, 1.2]} />
        <meshStandardMaterial
          color="#1e3a8a"
          emissive="#fbbf24"
          emissiveIntensity={(power / 100) * 0.6}
        />
      </mesh>
    </group>
  )
}

function Antenna() {
  const dish = useRef()
  useFrame((_, dt) => {
    dish.current.rotation.y += dt * 0.4
  })
  return (
    <group position={[-4.5, 0, 2]}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 1.6, 8]} />
        <meshStandardMaterial color="#d1d5db" />
      </mesh>
      <group ref={dish} position={[0, 1.7, 0]}>
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <coneGeometry args={[0.7, 0.5, 24, 1, true]} />
          <meshStandardMaterial color="#f3f4f6" side={2} />
        </mesh>
      </group>
    </group>
  )
}

function Astronaut({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.4, 4, 12]} />
        <meshStandardMaterial color="#f9fafb" />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Earth() {
  const ref = useRef()
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.05
  })
  return (
    <mesh ref={ref} position={[-20, 14, -35]}>
      <sphereGeometry args={[4, 32, 32]} />
      <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={0.35} roughness={0.8} />
    </mesh>
  )
}

function Sun() {
  const day = useGame((s) => s.day)
  const angle = day * 0.45
  return (
    <directionalLight
      position={[Math.cos(angle) * 20, 12, Math.sin(angle) * 20]}
      intensity={2.2}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-15}
      shadow-camera-right={15}
      shadow-camera-top={15}
      shadow-camera-bottom={-15}
    />
  )
}

export default function MoonBase() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [10, 6, 12], fov: 50 }}>
      <color attach="background" args={['#050816']} />
      <ambientLight intensity={0.25} />
      <Sun />
      <Stars radius={100} depth={50} count={3000} factor={4} fade />
      <Earth />
      <Ground />
      <Habitat />
      <SolarPanel position={[3.5, 0, 1]} />
      <SolarPanel position={[3.5, 0, -1.8]} />
      <Antenna />
      <Astronaut position={[2, 0, 3]} />
      <Astronaut position={[-2, 0, 3.4]} />
      <OrbitControls enablePan={false} minDistance={6} maxDistance={25} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  )
}