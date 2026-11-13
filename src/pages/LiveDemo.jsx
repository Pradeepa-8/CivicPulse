
import { useRef, useState } from 'react'
import Simulator3D from './simulator3D'

function LiveDemo() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  const [cameraOn, setCameraOn] = useState(false)
  const [showSimulator, setShowSimulator] = useState(false)
  const [message, setMessage] = useState('Camera is not started yet.')

  const [selectedImage, setSelectedImage] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(false)
  const [imageSize, setImageSize] = useState(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }
        },
        audio: false
      })

      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      setCameraOn(true)
      setMessage('Camera is running. Ready for road scanning.')
    } catch (error) {
      console.error(error)
      setMessage('Camera access failed. Please allow camera permission.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraOn(false)
    setMessage('Camera stopped.')
  }

  // Upload image and detect potholes
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid road image.')
      return
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }

    const previewUrl = URL.createObjectURL(file)

    setSelectedImage(file)
    setImageUrl(previewUrl)
    setDetections([])
    setImageSize(null)
    setLoading(true)
    setMessage('AI is analysing the road image...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://127.0.0.1:8000/detect', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Detection failed')
      }

      setDetections(result.detections || [])

      if ((result.detections || []).length > 0) {
        setMessage(
          `${result.total_potholes} pothole(s) detected successfully!`
        )
      } else {
        setMessage('AI scanned the image. No potholes detected.')
      }
    } catch (error) {
      console.error(error)
      setMessage('Backend connection failed. Check whether backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageLoad = (event) => {
    setImageSize({
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight
    })
  }

  const clearImage = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }

    setSelectedImage(null)
    setImageUrl('')
    setDetections([])
    setImageSize(null)
    setMessage('Select a road image to start AI detection.')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (showSimulator) {
    return (
      <div className="live-demo">
        <button
          onClick={() => setShowSimulator(false)}
          style={{ marginBottom: '20px' }}
        >
          ← Back to Live Demo
        </button>

        <Simulator3D />
      </div>
    )
  }

  return (
    <div className="live-demo">
      <header>
        <div>
          <p className="eyebrow">ROAD SAFETY INTELLIGENCE</p>
          <h1>Live Road Monitoring</h1>
          <p>AI-powered road hazard detection and monitoring.</p>
        </div>

        <span className="online">
          {cameraOn ? '● Camera Active' : '● Camera Offline'}
        </span>
      </header>

      <section className="scan-options">
        <div className="scan-card">
          <h2>📷 Real Road Live Scan</h2>
          <p>Use your device camera to monitor road conditions.</p>

          {!cameraOn ? (
            <button onClick={startCamera}>Start Camera</button>
          ) : (
            <button onClick={stopCamera}>Stop Camera</button>
          )}
        </div>

        <div className="scan-card">
          <h2>🚗 3D Demo Drive</h2>
          <p>Experience pothole detection in a virtual road.</p>

          <button
            onClick={() => {
              if (cameraOn) stopCamera()
              setShowSimulator(true)
            }}
          >
            Start 3D Demo Drive
          </button>
        </div>
      </section>

      <section className="detection-panel">
        <h2>Camera Monitor</h2>

        <div
          className="camera-placeholder"
          style={{
            minHeight: '300px',
            background: '#101827',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              maxHeight: '450px',
              objectFit: 'contain',
              display: cameraOn ? 'block' : 'none'
            }}
          />

          {!cameraOn && (
            <>
              <span style={{ fontSize: '45px' }}>📹</span>
              <p>Camera Preview</p>
              <small>Click Start Camera to begin.</small>
            </>
          )}
        </div>

        <p style={{ marginTop: '15px' }}>
          <strong>Status: </strong>{message}
        </p>
      </section>

      {/* Road Image Upload */}
      <section className="detection-panel" style={{ marginTop: '25px' }}>
        <h2>🕳️ AI Road Image Detection</h2>

        <p>
          Upload a road image. Our YOLO AI model will analyse it
          and identify potholes.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ marginTop: '12px', marginBottom: '15px' }}
        />

        {loading && (
          <p style={{ color: '#2563eb', fontWeight: 'bold' }}>
            AI is analysing the image...
          </p>
        )}

        {imageUrl && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              marginTop: '15px',
              background: '#101827',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <img
              src={imageUrl}
              alt="Uploaded road"
              onLoad={handleImageLoad}
              style={{
                display: 'block',
                width: '100%',
                height: 'auto'
              }}
            />

            {imageSize && (
              <svg
                viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                preserveAspectRatio="none"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              >
                {detections.map((detection, index) => {
                  const [x1, y1, x2, y2] = detection.box
                  const confidence = Math.round(
                    detection.confidence * 100
                  )

                  return (
                    <g key={index}>
                      <rect
                        x={x1}
                        y={y1}
                        width={x2 - x1}
                        height={y2 - y1}
                        fill="none"
                        stroke="#ff2020"
                        strokeWidth={Math.max(imageSize.width / 250, 3)}
                      />

                      <rect
                        x={x1}
                        y={Math.max(0, y1 - imageSize.height * 0.055)}
                        width={imageSize.width * 0.28}
                        height={imageSize.height * 0.055}
                        fill="#ff2020"
                      />

                      <text
                        x={x1 + 5}
                        y={Math.max(18, y1 - imageSize.height * 0.018)}
                        fill="white"
                        fontSize={Math.max(imageSize.width * 0.025, 14)}
                        fontWeight="bold"
                      >
                        Pothole {confidence}%
                      </text>
                    </g>
                  )
                })}
              </svg>
            )}
          </div>
        )}

        {selectedImage && (
          <div style={{ marginTop: '15px' }}>
            <p>
              <strong>Image:</strong> {selectedImage.name}
            </p>

            <p>
              <strong>Total Potholes Detected:</strong>{' '}
              {detections.length}
            </p>

            {detections.map((item, index) => (
              <p key={index}>
                Pothole {index + 1} – Confidence:{' '}
                {(item.confidence * 100).toFixed(1)}%
              </p>
            ))}

            <button
              onClick={clearImage}
              style={{ marginTop: '10px' }}
            >
              Clear Image
            </button>
          </div>
        )}

        <p style={{ marginTop: '15px' }}>
          <strong>AI Status: </strong>{message}
        </p>
      </section>
    </div>
  )
}

export default LiveDemo
