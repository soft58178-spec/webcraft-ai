import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

export default function LoadingScreen({ onComplete }) {
  const canvasRef = useRef()
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('init')

  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 5

    // Central glowing sphere
    const sphereGeo = new THREE.IcosahedronGeometry(1.2, 4)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: '#6c63ff',
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      emissive: '#6c63ff',
      emissiveIntensity: 0.3
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    scene.add(sphere)

    // Inner sphere
    const innerGeo = new THREE.IcosahedronGeometry(0.8, 2)
    const innerMat = new THREE.MeshStandardMaterial({
      color: '#00d4ff',
      wireframe: true,
      transparent: true,
      opacity: 0.4,
      emissive: '#00d4ff',
      emissiveIntensity: 0.5
    })
    const innerSphere = new THREE.Mesh(innerGeo, innerMat)
    scene.add(innerSphere)

    // Orbiting rings
    const rings = []
    const ringColors = ['#6c63ff', '#00d4ff', '#ff6b6b']
    ringColors.forEach((color, i) => {
      const ringGeo = new THREE.TorusGeometry(1.8 + i * 0.5, 0.02, 16, 100)
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        emissive: color,
        emissiveIntensity: 0.4
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / (2 + i)
      ring.rotation.y = (i * Math.PI) / 3
      rings.push(ring)
      scene.add(ring)
    })

    // Particles
    const particleCount = 2000
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: '#6c63ff',
      size: 0.05,
      transparent: true,
      opacity: 0.8
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
    scene.add(ambientLight)
    const pointLight1 = new THREE.PointLight('#6c63ff', 2, 10)
    pointLight1.position.set(3, 3, 3)
    scene.add(pointLight1)
    const pointLight2 = new THREE.PointLight('#00d4ff', 2, 10)
    pointLight2.position.set(-3, -3, -3)
    scene.add(pointLight2)

    let frame = 0
    const animate = () => {
      frame++
      const t = frame * 0.01

      sphere.rotation.x = t * 0.3
      sphere.rotation.y = t * 0.5
      innerSphere.rotation.x = -t * 0.4
      innerSphere.rotation.y = -t * 0.3

      rings.forEach((ring, i) => {
        ring.rotation.x += 0.005 * (i + 1)
        ring.rotation.z += 0.003 * (i + 1)
      })

      particles.rotation.y = t * 0.05
      particles.rotation.x = t * 0.03

      // Pulse effect
      const scale = 1 + Math.sin(t * 2) * 0.05
      sphere.scale.setScalar(scale)

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    // Progress simulation
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 3
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setPhase('complete')
        setTimeout(() => onComplete?.(), 800)
      }
      setProgress(Math.floor(p))
    }, 50)

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [])

  const loadingTexts = [
    'Initializing 3D Engine...',
    'Loading WebGL Shaders...',
    'Preparing AI Models...',
    'Setting up Neural Networks...',
    'Calibrating Design System...',
    'Ready to Create!'
  ]

  const textIndex = Math.floor((progress / 100) * (loadingTexts.length - 1))

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#020208',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        }}
      />

      {/* Radial gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, transparent 30%, #020208 80%)',
        pointerEvents: 'none'
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Logo */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 60px rgba(108,99,255,0.6), 0 0 120px rgba(108,99,255,0.2)',
            fontSize: '36px'
          }}
        >
          ⚡
        </motion.div>

        {/* Title */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '32px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #6c63ff, #00d4ff, #ff6b6b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-1px',
              marginBottom: '4px'
            }}
          >
            WebCraft AI Pro
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Next Generation Website Builder
          </motion.p>
        </div>

        {/* Loading text */}
        <motion.div
          key={textIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            color: 'rgba(108,99,255,0.8)',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.5px'
          }}
        >
          {loadingTexts[textIndex]}
        </motion.div>

        {/* Progress bar */}
        <div style={{ width: '280px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
              Loading
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(108,99,255,0.8)', fontFamily: 'JetBrains Mono, monospace' }}>
              {progress}%
            </span>
          </div>
          <div style={{
            height: '3px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #6c63ff, #00d4ff)',
                borderRadius: '2px',
                boxShadow: '0 0 10px rgba(108,99,255,0.8)'
              }}
            />
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#6c63ff'
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
