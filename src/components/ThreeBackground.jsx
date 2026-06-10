import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function NebulaParticles() {
  const ref = useRef()
  const count = 8000
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 50 + 10
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.015
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1
    }
  })
  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#6c63ff" size={0.06} sizeAttenuation depthWrite={false} opacity={0.5} blending={THREE.AdditiveBlending} />
    </Points>
  )
}

function GoldenParticles() {
  const ref = useRef()
  const count = 3000
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    return pos
  }, [])
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = -state.clock.elapsedTime * 0.02
      ref.current.rotation.z = state.clock.elapsedTime * 0.01
    }
  })
  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#00d4ff" size={0.04} sizeAttenuation depthWrite={false} opacity={0.4} blending={THREE.AdditiveBlending} />
    </Points>
  )
}

function FloatingCrystal({ position, color, speed, size, rotSpeed }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime
      ref.current.position.y = position[1] + Math.sin(t * speed) * 0.8
      ref.current.position.x = position[0] + Math.cos(t * speed * 0.7) * 0.4
      ref.current.rotation.x += rotSpeed
      ref.current.rotation.y += rotSpeed * 1.3
      ref.current.rotation.z += rotSpeed * 0.7
    }
  })
  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={color} wireframe={false} transparent opacity={0.15} emissive={color} emissiveIntensity={0.5} roughness={0.1} metalness={0.9} />
    </mesh>
  )
}

function FloatingOrb({ position, color, speed, size }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime
      ref.current.position.y = position[1] + Math.sin(t * speed) * 0.6
      ref.current.position.x = position[0] + Math.cos(t * speed * 0.8) * 0.3
      ref.current.rotation.x = t * 0.2
      ref.current.rotation.z = t * 0.15
    }
  })
  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={[size, 1]} />
      <meshStandardMaterial color={color} wireframe transparent opacity={0.12} emissive={color} emissiveIntensity={0.4} />
    </mesh>
  )
}

function EnergyRing({ radius, color, speed, tilt }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * speed
  })
  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.015, 16, 120]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} emissive={color} emissiveIntensity={0.6} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}

function MovingLight() {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref.current) {
      ref.current.position.x = Math.sin(t * 0.5) * 8
      ref.current.position.y = Math.cos(t * 0.3) * 6
      ref.current.position.z = Math.sin(t * 0.4) * 4
    }
  })
  return <pointLight ref={ref} color="#6c63ff" intensity={3} distance={20} />
}

function MovingLight2() {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref.current) {
      ref.current.position.x = Math.cos(t * 0.4) * 10
      ref.current.position.y = Math.sin(t * 0.5) * 8
      ref.current.position.z = Math.cos(t * 0.3) * 5
    }
  })
  return <pointLight ref={ref} color="#00d4ff" intensity={2} distance={20} />
}

function CameraMovement() {
  const { camera } = useThree()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    camera.position.x = Math.sin(t * 0.05) * 1.5
    camera.position.y = Math.cos(t * 0.04) * 1
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <MovingLight />
      <MovingLight2 />
      <pointLight position={[0, 0, -10]} color="#ff6b6b" intensity={1} distance={30} />
      <CameraMovement />
      <NebulaParticles />
      <GoldenParticles />
      <EnergyRing radius={4} color="#6c63ff" speed={0.3} tilt={Math.PI / 4} />
      <EnergyRing radius={6} color="#00d4ff" speed={-0.2} tilt={Math.PI / 3} />
      <EnergyRing radius={8} color="#ff6b6b" speed={0.15} tilt={Math.PI / 6} />
      <EnergyRing radius={10} color="#6c63ff" speed={-0.1} tilt={Math.PI / 2.5} />
      <FloatingCrystal position={[-5, 2, -8]} color="#6c63ff" speed={0.4} size={0.8} rotSpeed={0.008} />
      <FloatingCrystal position={[5, -1, -10]} color="#00d4ff" speed={0.3} size={1.2} rotSpeed={0.006} />
      <FloatingCrystal position={[0, 3, -6]} color="#ff6b6b" speed={0.5} size={0.6} rotSpeed={0.01} />
      <FloatingCrystal position={[-7, -2, -12]} color="#6c63ff" speed={0.25} size={1.5} rotSpeed={0.005} />
      <FloatingCrystal position={[7, 1, -9]} color="#00d4ff" speed={0.35} size={0.9} rotSpeed={0.007} />
      <FloatingOrb position={[-3, 0, -5]} color="#6c63ff" speed={0.4} size={1.5} />
      <FloatingOrb position={[4, 2, -7]} color="#00d4ff" speed={0.3} size={2} />
      <FloatingOrb position={[0, -2, -9]} color="#ff6b6b" speed={0.45} size={1.2} />
      <FloatingOrb position={[-6, 1, -11]} color="#6c63ff" speed={0.2} size={2.5} />
    </>
  )
}

export default function ThreeBackground() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 70 }} style={{ background: 'transparent' }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}>
        <Scene />
      </Canvas>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 50%, rgba(108,99,255,0.12) 0%, transparent 55%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 85% 50%, rgba(0,212,255,0.08) 0%, transparent 55%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.06) 0%, transparent 50%)', pointerEvents: 'none' }} />
    </div>
  )
}
