import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Hand, Keyboard, X, Minimize2 } from 'lucide-react'

const GESTURE_KEYS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M','⌫'],
  ['SPACE', 'ENTER']
]

export default function GestureControl({ onText, isOpen, onClose }) {
  const videoRef = useRef()
  const canvasRef = useRef()
  const [isActive, setIsActive] = useState(false)
  const [gesture, setGesture] = useState(null)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [hoveredKey, setHoveredKey] = useState(null)
  const [typedText, setTypedText] = useState('')
  const [cameraError, setCameraError] = useState(false)
  const [hands, setHands] = useState(null)
  const streamRef = useRef()

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsActive(true)
        setCameraError(false)
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError(true)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setIsActive(false)
    setGesture(null)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      return
    }

    // Load MediaPipe
    const loadMediaPipe = async () => {
      try {
        if (window.Hands) {
          initHands()
          return
        }

        const script1 = document.createElement('script')
        script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
        document.head.appendChild(script1)

        const script2 = document.createElement('script')
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
        script2.onload = () => setTimeout(initHands, 500)
        document.head.appendChild(script2)
      } catch (err) {
        console.error('MediaPipe load error:', err)
      }
    }

    const initHands = () => {
      if (!window.Hands) return

      const handsInstance = new window.Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      })

      handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      })

      handsInstance.onResults(onHandResults)
      setHands(handsInstance)
    }

    loadMediaPipe()
    startCamera()

    return () => stopCamera()
  }, [isOpen])

  const onHandResults = useCallback((results) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!results.multiHandLandmarks?.length) {
      setGesture(null)
      return
    }

    const landmarks = results.multiHandLandmarks[0]

    // Draw hand skeleton
    ctx.strokeStyle = '#6c63ff'
    ctx.lineWidth = 2

    // Draw connections
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17]
    ]

    connections.forEach(([a, b]) => {
      ctx.beginPath()
      ctx.moveTo(landmarks[a].x * canvas.width, landmarks[a].y * canvas.height)
      ctx.lineTo(landmarks[b].x * canvas.width, landmarks[b].y * canvas.height)
      ctx.stroke()
    })

    // Draw joints
    landmarks.forEach((lm, i) => {
      ctx.beginPath()
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, i === 8 ? 8 : 4, 0, Math.PI * 2)
      ctx.fillStyle = i === 8 ? '#00d4ff' : '#6c63ff'
      ctx.fill()
    })

    // Index finger tip position for cursor
    const indexTip = landmarks[8]
    const x = (1 - indexTip.x) * window.innerWidth
    const y = indexTip.y * window.innerHeight
    setCursorPos({ x, y })

    // Detect gestures
    const detectedGesture = detectGesture(landmarks)
    setGesture(detectedGesture)

  }, [])

  const detectGesture = (landmarks) => {
    const fingers = {
      thumb: landmarks[4].y < landmarks[3].y,
      index: landmarks[8].y < landmarks[6].y,
      middle: landmarks[12].y < landmarks[10].y,
      ring: landmarks[16].y < landmarks[14].y,
      pinky: landmarks[20].y < landmarks[18].y
    }

    const extended = Object.values(fingers).filter(Boolean).length

    if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) return 'point'
    if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) return 'peace'
    if (extended === 0) return 'fist'
    if (extended === 5) return 'open'
    if (fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && fingers.pinky) return 'shaka'

    return null
  }

  // Process video frames
  useEffect(() => {
    if (!isActive || !hands || !videoRef.current) return

    let animFrame
    const processFrame = async () => {
      if (videoRef.current?.readyState === 4) {
        await hands.send({ image: videoRef.current })
      }
      animFrame = requestAnimationFrame(processFrame)
    }
    processFrame()

    return () => cancelAnimationFrame(animFrame)
  }, [isActive, hands])

  const handleKeyClick = (key) => {
    if (key === '⌫') {
      const newText = typedText.slice(0, -1)
      setTypedText(newText)
      onText?.(newText)
    } else if (key === 'SPACE') {
      const newText = typedText + ' '
      setTypedText(newText)
      onText?.(newText)
    } else if (key === 'ENTER') {
      onText?.(typedText)
      setTypedText('')
    } else {
      const newText = typedText + key
      setTypedText(newText)
      onText?.(newText)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(2,2,8,0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}
      >
        {/* Header */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Hand size={20} color="#6c63ff" />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
              Gesture Control
            </span>
            {gesture && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(108,99,255,0.2)',
                  border: '1px solid rgba(108,99,255,0.4)',
                  color: '#a89fff',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {gesture}
              </motion.div>
            )}
          </div>
          <button
            onClick={() => { stopCamera(); onClose?.() }}
            style={{
              background: 'rgba(255,68,68,0.1)',
              border: '1px solid rgba(255,68,68,0.3)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: '#ff4444',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Main content */}
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
          marginTop: '60px'
        }}>
          {/* Camera feed */}
          <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(108,99,255,0.3)',
            background: 'rgba(0,0,0,0.5)'
          }}>
            <video
              ref={videoRef}
              width={320}
              height={240}
              style={{
                display: 'block',
                transform: 'scaleX(-1)',
                opacity: isActive ? 1 : 0.3
              }}
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              width={320}
              height={240}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: 'scaleX(-1)'
              }}
            />

            {!isActive && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <Camera size={32} color="rgba(255,255,255,0.3)" />
                {cameraError ? (
                  <span style={{ color: 'rgba(255,68,68,0.8)', fontSize: '12px', textAlign: 'center', padding: '0 16px' }}>
                    Camera access denied
                  </span>
                ) : (
                  <button
                    onClick={startCamera}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6c63ff, #5a52e0)',
                      color: 'white',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Enable Camera
                  </button>
                )}
              </div>
            )}

            {/* Status */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isActive ? '#00ff88' : '#ff4444',
                boxShadow: isActive ? '0 0 8px #00ff88' : 'none'
              }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                {isActive ? 'Camera Active' : 'Camera Off'}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minWidth: '200px'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Gestures
            </div>
            {[
              { gesture: '☝️ Point', action: 'Move cursor' },
              { gesture: '✌️ Peace', action: 'Click / Select' },
              { gesture: '✊ Fist', action: 'Drag' },
              { gesture: '🤙 Shaka', action: 'Send message' },
              { gesture: '🖐 Open', action: 'Scroll up' },
            ].map(({ gesture, action }) => (
              <div key={gesture} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <span style={{ fontSize: '16px' }}>{gesture.split(' ')[0]}</span>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    {gesture.split(' ').slice(1).join(' ')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                    {action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Virtual Keyboard */}
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <Keyboard size={16} color="#6c63ff" />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              Virtual Keyboard
            </span>
          </div>

          {/* Text display */}
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '12px',
            minHeight: '40px',
            fontSize: '14px',
            color: 'white',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {typedText || <span style={{ color: 'rgba(255,255,255,0.2)' }}>Type with gestures or click keys...</span>}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ color: '#6c63ff' }}
            >|</motion.span>
          </div>

          {/* Keys */}
          {GESTURE_KEYS.map((row, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '6px',
              justifyContent: 'center'
            }}>
              {row.map(key => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.1, background: 'rgba(108,99,255,0.3)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleKeyClick(key)}
                  style={{
                    padding: key === 'SPACE' ? '8px 40px' : key === 'ENTER' ? '8px 20px' : '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: hoveredKey === key
                      ? 'rgba(108,99,255,0.3)'
                      : 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.15s ease',
                    minWidth: key.length > 1 ? 'auto' : '36px'
                  }}
                >
                  {key}
                </motion.button>
              ))}
            </div>
          ))}
        </div>

        {/* Gesture cursor */}
        {isActive && gesture === 'point' && (
          <motion.div
            animate={{ x: cursorPos.x - 10, y: cursorPos.y - 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
              position: 'fixed',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(108,99,255,0.6)',
              border: '2px solid #6c63ff',
              boxShadow: '0 0 20px rgba(108,99,255,0.8)',
              pointerEvents: 'none',
              zIndex: 9999
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
