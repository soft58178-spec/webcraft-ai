import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function StarField() {
  const ref = useRef()

  const positions = useMemo(() => {
    const pos = new Float32Array(5000 * 3)
    for (let i = 0; i < 5000; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    return pos
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.02
      ref.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#6c63ff"
        size={0.08}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  )
}

function FloatingOrb({ position, color, speed, size }) {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5
      ref.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * speed * 0.7) * 0.3
      ref.current.rotation.x = state.clock.elapsedTime * 0.2
      ref.current.rotation.z = state.clock.elapsedTime * 0.15
    }
  })

  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={[size, 1]} />
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.15}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

function GridPlane() {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.z = (state.clock.elapsedTime * 0.5) % 2
    }
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[40, 40, 20, 20]} />
      <meshStandardMaterial
        color="#6c63ff"
        wireframe
        transparent
        opacity={0.05}
      />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} color="#6c63ff" intensity={0.5} />
      <pointLight position={[-10, -10, -10]} color="#00d4ff" intensity={0.3} />

      <StarField />
      <GridPlane />

      <FloatingOrb position={[-4, 1, -5]} color="#6c63ff" speed={0.4} size={1.2} />
      <FloatingOrb position={[4, -1, -8]} color="#00d4ff" speed={0.3} size={1.8} />
      <FloatingOrb position={[0, 2, -6]} color="#ff6b6b" speed={0.5} size={0.8} />
      <FloatingOrb position={[-6, -2, -10]} color="#6c63ff" speed={0.25} size={2.2} />
      <FloatingOrb position={[6, 3, -7]} color="#00d4ff" speed={0.35} size={1.0} />
    </>
  )
}

export default function ThreeBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none'
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>

      {/* Gradient overlays */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(108, 99, 255, 0.08) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 80% 50%, rgba(0, 212, 255, 0.06) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 100%, rgba(108, 99, 255, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
    </div>
  )
}
