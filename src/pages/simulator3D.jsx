
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// Create simulated pothole
function createPothole(scene, x, z) {
  const group = new THREE.Group()
  const points = 16

  const outerShape = new THREE.Shape()

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    const variation = 1 + Math.sin(i * 2.4) * 0.13
    const px = Math.cos(angle) * 1.05 * variation
    const py = Math.sin(angle) * 0.62 * variation

    if (i === 0) outerShape.moveTo(px, py)
    else outerShape.lineTo(px, py)
  }

  const outer = new THREE.Mesh(
    new THREE.ShapeGeometry(outerShape),
    new THREE.MeshStandardMaterial({
      color: 0x55514d,
      roughness: 1,
      side: THREE.DoubleSide
    })
  )

  outer.rotation.x = -Math.PI / 2
  outer.position.y = 0.035
  group.add(outer)

  const innerShape = new THREE.Shape()

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    const variation = 1 + Math.cos(i * 3.1) * 0.1
    const px = Math.cos(angle) * 0.78 * variation
    const py = Math.sin(angle) * 0.43 * variation

    if (i === 0) innerShape.moveTo(px, py)
    else innerShape.lineTo(px, py)
  }

  const inner = new THREE.Mesh(
    new THREE.ShapeGeometry(innerShape),
    new THREE.MeshStandardMaterial({
      color: 0x101113,
      roughness: 1,
      side: THREE.DoubleSide
    })
  )

  inner.rotation.x = -Math.PI / 2
  inner.position.y = 0.045
  group.add(inner)

  const crackMaterial = new THREE.LineBasicMaterial({
    color: 0x252525
  })

  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2
    const startX = Math.cos(angle) * 0.9
    const startZ = Math.sin(angle) * 0.55

    const crackPoints = [
      new THREE.Vector3(startX, 0.05, -startZ),
      new THREE.Vector3(
        startX + Math.cos(angle) * 0.25,
        0.05,
        -startZ - Math.sin(angle) * 0.2
      ),
      new THREE.Vector3(
        startX + Math.cos(angle) * 0.4,
        0.05,
        -startZ - Math.sin(angle) * 0.35
      )
    ]

    const crack = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(crackPoints),
      crackMaterial
    )

    group.add(crack)
  }

  group.position.set(x, 0, z)
  scene.add(group)

  return group
}

function Simulator3D() {
  const mountRef = useRef(null)
  const drivingRef = useRef(false)
  const speedRef = useRef(40)
  const lastVoiceRef = useRef(0)

  const [driving, setDriving] = useState(false)
  const [speed, setSpeed] = useState(40)
  const [detections, setDetections] = useState([])
  const [aiStatus, setAiStatus] = useState(
    'AI is waiting for the drive.'
  )

  const [frameSize, setFrameSize] = useState({
    width: 1,
    height: 1
  })

  useEffect(() => {
    drivingRef.current = driving
  }, [driving])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87b8df)
    scene.fog = new THREE.Fog(0x87b8df, 35, 110)

    const camera = new THREE.PerspectiveCamera(
      65,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200
    )

    camera.position.set(0, 3.2, 7)
    camera.lookAt(0, 1, -20)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true
    })

    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    mount.appendChild(renderer.domElement)

    let aiRequestRunning = false
    let lastAiScan = 0
    let debugFrameSaved = false
    let animationId
    let lastTime = 0
    let active = true

    // Lighting
    scene.add(
      new THREE.HemisphereLight(0xffffff, 0x526044, 2)
    )

    const sunlight = new THREE.DirectionalLight(0xffffff, 2)
    sunlight.position.set(-10, 20, 10)
    sunlight.castShadow = true
    scene.add(sunlight)

    // Road
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 120),
      new THREE.MeshStandardMaterial({
        color: 0x34383d,
        roughness: 1
      })
    )

    road.rotation.x = -Math.PI / 2
    road.position.z = -30
    road.receiveShadow = true
    scene.add(road)

    // Roadside ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 140),
      new THREE.MeshStandardMaterial({
        color: 0x65845a
      })
    )

    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, -0.08, -30)
    scene.add(ground)

    // Lane markings
    const laneMarks = []

    for (let i = 0; i < 20; i++) {
      const mark = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.025, 3),
        new THREE.MeshStandardMaterial({
          color: 0xffffff
        })
      )

      mark.position.set(0, 0.025, 5 - i * 6)
      scene.add(mark)
      laneMarks.push(mark)
    }

    // Trees
    const trees = []

    for (let i = 0; i < 24; i++) {
      for (const side of [-1, 1]) {
        const group = new THREE.Group()

        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.22, 2, 8),
          new THREE.MeshStandardMaterial({
            color: 0x705039
          })
        )

        trunk.position.y = 1

        const leaves = new THREE.Mesh(
          new THREE.SphereGeometry(1.1, 12, 12),
          new THREE.MeshStandardMaterial({
            color: 0x287344,
            roughness: 1
          })
        )

        leaves.position.y = 2.5

        group.add(trunk, leaves)
        group.position.set(side * 9, 0, -i * 5 - 8)
        scene.add(group)
        trees.push(group)
      }
    }

    // Simulated potholes
    const potholes = [
      createPothole(scene, -1.4, -25),
      createPothole(scene, 1.5, -50),
      createPothole(scene, -1.2, -75)
    ]

    // Dashboard
    const dashboard = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.35, 1.5),
      new THREE.MeshStandardMaterial({
        color: 0x171b20,
        roughness: 0.8
      })
    )

    dashboard.position.set(0, 0.15, 7)
    scene.add(dashboard)

    // Voice warning
    const speakWarning = () => {
      if (!('speechSynthesis' in window)) return

      const now = Date.now()

      if (now - lastVoiceRef.current < 8000) return

      lastVoiceRef.current = now
      window.speechSynthesis.cancel()

      const message = new SpeechSynthesisUtterance(
        'Warning! Pothole ahead.'
      )

      message.rate = 1
      window.speechSynthesis.speak(message)
    }

    // AI frame scanning
    const scanRenderedFrame = async () => {
      if (aiRequestRunning || !active) return

      aiRequestRunning = true

      try {
        const blob = await new Promise(resolve => {
          renderer.domElement.toBlob(
            resolve,
            'image/jpeg',
            0.85
          )
        })

        if (!blob || !active) return

        // Download the first captured 3D frame for inspection
        if (!debugFrameSaved) {
          debugFrameSaved = true

          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')

          link.href = url
          link.download = 'civicpulse-3d-frame.jpg'
          document.body.appendChild(link)
          link.click()
          link.remove()

          setTimeout(() => {
            URL.revokeObjectURL(url)
          }, 1000)
        }

        const formData = new FormData()

        formData.append(
          'file',
          blob,
          'simulated-road.jpg'
        )

        const response = await fetch(
          'http://127.0.0.1:8000/detect',
          {
            method: 'POST',
            body: formData
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail || 'AI detection failed'
          )
        }

        if (!active) return

        const results = data.detections || []

        setDetections(results)

        setFrameSize({
          width: renderer.domElement.width,
          height: renderer.domElement.height
        })

        if (results.length > 0) {
          setAiStatus(
            `${results.length} pothole(s) detected by AI!`
          )

          speakWarning()
        } else {
          setAiStatus(
            'AI scanned frame. No potholes detected.'
          )
        }

      } catch (error) {
        console.error('AI Detection Error:', error)

        if (active) {
          setAiStatus(
            'AI connection failed. Check backend.'
          )
        }

      } finally {
        aiRequestRunning = false
      }
    }

    // Animation
    const animate = (time) => {
      animationId = requestAnimationFrame(animate)

      const delta = lastTime
        ? Math.min((time - lastTime) / 1000, 0.05)
        : 0

      lastTime = time

      if (drivingRef.current) {
        const movement = speedRef.current * 0.12 * delta

        laneMarks.forEach(mark => {
          mark.position.z += movement

          if (mark.position.z > 8) {
            mark.position.z -= 120
          }
        })

        trees.forEach(tree => {
          tree.position.z += movement

          if (tree.position.z > 10) {
            tree.position.z -= 120
          }
        })

        potholes.forEach(hole => {
          hole.position.z += movement

          if (hole.position.z > 9) {
            hole.position.z = -95
          }
        })
      }

      renderer.render(scene, camera)

      if (
        drivingRef.current &&
        time - lastAiScan >= 2000
      ) {
        lastAiScan = time
        scanRenderedFrame()
      }
    }

    animate(0)

    // Resize
    const resize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return

      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()

      renderer.setSize(
        mount.clientWidth,
        mount.clientHeight
      )
    }

    window.addEventListener('resize', resize)

    // Cleanup
    return () => {
      active = false

      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)

      window.speechSynthesis?.cancel()

      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose()

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })

      renderer.dispose()

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>🚗 3D Demo Drive</h1>
      <p>AI-powered simulated road hazard monitoring.</p>

      {/* 3D Road */}
      <div
        style={{
          width: '100%',
          height: '480px',
          position: 'relative',
          background: '#87b8df',
          borderRadius: '14px',
          overflow: 'hidden'
        }}
      >
        <div
          ref={mountRef}
          style={{
            width: '100%',
            height: '100%'
          }}
        />

        {/* AI Bounding Boxes */}
        <svg
          viewBox={`0 0 ${frameSize.width} ${frameSize.height}`}
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        >
          {detections.map((item, index) => {
            const [x1, y1, x2, y2] = item.box

            return (
              <g key={index}>
                <rect
                  x={x1}
                  y={y1}
                  width={x2 - x1}
                  height={y2 - y1}
                  fill="none"
                  stroke="#ff3030"
                  strokeWidth="5"
                />

                <text
                  x={x1}
                  y={Math.max(y1 - 10, 25)}
                  fill="#ff3030"
                  fontSize="28"
                  fontWeight="bold"
                  stroke="#ffffff"
                  strokeWidth="1"
                  paintOrder="stroke"
                >
                  POTHOLE {(item.confidence * 100).toFixed(0)}%
                </text>
              </g>
            )
          })}
        </svg>

        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 3,
            background: '#101827',
            color: '#fbbf24',
            padding: '7px 12px',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        >
          SIMULATED ROAD
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          marginTop: '15px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <button
          onClick={() => {
            setDriving(!driving)
            setDetections([])
            setAiStatus(
              driving
                ? 'Simulation paused.'
                : 'Connecting to AI detection...'
            )
          }}
        >
          {driving ? 'Pause Drive' : 'Start Drive'}
        </button>

        <label>
          Speed: {speed} km/h

          <input
            type="range"
            min="20"
            max="80"
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
          />
        </label>
      </div>

      <p>
        Status: {driving
          ? 'Simulation Running'
          : 'Simulation Paused'}
      </p>

      {/* AI Monitor */}
      <div
        style={{
          marginTop: '20px',
          padding: '18px',
          background: '#101827',
          color: 'white',
          borderRadius: '12px'
        }}
      >
        <h3>🤖 AI Detection Monitor</h3>
        <p>{aiStatus}</p>

        <h2>Total Detected: {detections.length}</h2>

        {detections.map((item, index) => (
          <p key={index}>
            Pothole {index + 1} — Confidence:{' '}
            {(item.confidence * 100).toFixed(0)}%
          </p>
        ))}
      </div>

      <p style={{ color: '#d97706' }}>
        DEMO MODE – Simulated road hazards
      </p>
    </div>
  )
}

export default Simulator3D
