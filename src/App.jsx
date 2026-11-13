
import { useState } from 'react'
import LiveDemo from './pages/LiveDemo'
import './index.css'

const stats = [
  { label: 'Total Hazards', value: '128', icon: '🕳️' },
  { label: 'High Risk Areas', value: '24', icon: '⚠️' },
  { label: 'Locations Mapped', value: '86', icon: '📍' },
  { label: 'Roads Repaired', value: '32', icon: '🛠️' }
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🌐 CivicPulse <span>AI</span></h2>
        <p className="subtitle">SMART ROAD INTELLIGENCE</p>

        <p className="menu-title">MAIN MENU</p>

        <nav>
          <a
            className={activePage === 'Dashboard' ? 'active' : ''}
            onClick={() => setActivePage('Dashboard')}
            style={{ cursor: 'pointer' }}
          >
            ▦ Dashboard
          </a>

          <a
            className={activePage === 'Live Demo' ? 'active' : ''}
            onClick={() => setActivePage('Live Demo')}
            style={{ cursor: 'pointer' }}
          >
            ◉ Live Demo
          </a>

          <a>⌖ Hazard Map</a>
          <a>⇄ Safe Route</a>
          <a>◷ Detection History</a>
          <a>▤ Reports</a>
          <a>⚒ Repair Tracking</a>
        </nav>

        <div className="admin">👤 Administrator</div>
      </aside>

      <main className="main">

        {activePage === 'Live Demo' ? (
          <LiveDemo />
        ) : (
          <>
            <header>
              <div>
                <p className="eyebrow">ROAD SAFETY INTELLIGENCE</p>
                <h1>Dashboard</h1>
              </div>
              <span className="online">● System Online</span>
            </header>

            <section className="welcome">
              <div>
                <p>CIVICPULSE AI MONITORING</p>
                <h2>Smarter Roads. Safer Journeys.</h2>
                <span>
                  AI-powered road hazard detection and monitoring.
                </span>
              </div>
              <div className="car">🚘</div>
            </section>

            <section className="stats">
              {stats.map(item => (
                <div className="stat-card" key={item.label}>
                  <div>
                    {item.label} <span>{item.icon}</span>
                  </div>
                  <h2>{item.value}</h2>
                  <small>Demo statistics</small>
                </div>
              ))}
            </section>

            <section className="heading">
              <h2>Road Monitoring</h2>
              <p>Choose a mode to monitor road conditions.</p>
            </section>

            <section className="modes">
              <div className="mode-card">
                <div className="mode-icon">📷</div>
                <small>REAL CAMERA</small>
                <h3>Live Road Scan</h3>
                <p>
                  Detect actual potholes using camera, GPS and voice alerts.
                </p>
                <button onClick={() => setActivePage('Live Demo')}>
                  Open Live Scan →
                </button>
              </div>

              <div className="mode-card">
                <div className="mode-icon">🚗</div>
                <small>3D SIMULATION</small>
                <h3>3D Demo Drive</h3>
                <p>
                  Explore a virtual road and demonstrate pothole warnings.
                </p>
                <button onClick={() => setActivePage('Live Demo')}>
                  Start 3D Drive →
                </button>
              </div>
            </section>

            <section className="heading">
              <h2>Recent Hazard Reports</h2>
              <p>Sample entries for dashboard preview.</p>
            </section>

            <section className="report">
              <div className="report-row">
                <b>PH-001</b>
                <span>Madurai - Anna Nagar</span>
                <strong className="high">High</strong>
                <span>Reported</span>
              </div>

              <div className="report-row">
                <b>PH-002</b>
                <span>KK Nagar Main Road</span>
                <strong className="medium">Medium</strong>
                <span>Under Review</span>
              </div>

              <p>These are sample records, not actual detections.</p>
            </section>

            <footer>
              © 2026 CivicPulse AI | Intelligent Road Safety System
            </footer>
          </>
        )}

      </main>
    </div>
  )
}

export default App
