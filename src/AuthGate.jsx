
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import App from './App'

function AuthGate() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [status, setStatus] = useState(null)
  const [requests, setRequests] = useState([])
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      checkUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkUser(session?.user ?? null)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  async function checkUser(currentUser) {
    setUser(currentUser)
    setIsAdmin(false)
    setStatus(null)

    if (!currentUser) {
      setLoading(false)
      return
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (admin) {
      setIsAdmin(true)
      await loadRequests()
    } else {
      const { data: request } = await supabase
        .from('access_requests')
        .select('status')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      setStatus(request?.status ?? 'not_requested')
    }

    setLoading(false)
  }

  async function loadRequests() {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setRequests(data ?? [])
  }

  async function handleAuth(e) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    let result

    if (mode === 'signup') {
      result = await supabase.auth.signUp({ email, password })
    } else {
      result = await supabase.auth.signInWithPassword({ email, password })
    }

    if (result.error) {
      setMessage(result.error.message)
      setLoading(false)
      return
    }

    if (mode === 'signup' && !result.data.session) {
      setMessage('Account created. Please sign in to continue.')
      setMode('login')
      setLoading(false)
      return
    }

    if (result.data.user) {
      await checkUser(result.data.user)
    }
  }

  async function requestAccess() {
    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('access_requests')
      .insert({
        user_id: user.id,
        email: user.email,
        status: 'pending'
      })

    if (error) {
      setMessage(error.message)
    } else {
      setStatus('pending')
      setMessage('Access request submitted successfully!')
    }

    setLoading(false)
  }

  async function updateRequest(id, newStatus) {
    const { error } = await supabase
      .from('access_requests')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      setMessage(error.message)
    } else {
      await loadRequests()
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setStatus(null)
    setRequests([])
  }

  if (loading) {
    return <div style={styles.page}>Loading CivicPulse...</div>
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1>🌐 CivicPulse <span style={{ color: '#38bdf8' }}>AI</span></h1>
          <p>SMART ROAD INTELLIGENCE</p>

          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>

          <form onSubmit={handleAuth}>
            <input
              style={styles.input}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Password (minimum 6 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              required
            />

            <button style={styles.button} disabled={loading}>
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <p>{message}</p>

          <button
            style={styles.link}
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setMessage('')
            }}
          >
            {mode === 'login'
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div style={styles.adminPage}>
        <header style={styles.header}>
          <h2>CivicPulse Admin</h2>
          <button style={styles.button} onClick={logout}>Logout</button>
        </header>

        <h2>Access Requests</h2>

        {requests.length === 0 && <p>No access requests yet.</p>}

        {requests.map(request => (
          <div style={styles.request} key={request.id}>
            <div>
              <strong>{request.email}</strong>
              <p>Status: {request.status}</p>
            </div>

            {request.status === 'pending' && (
              <div>
                <button
                  style={styles.approve}
                  onClick={() => updateRequest(request.id, 'approved')}
                >
                  Approve
                </button>
                <button
                  style={styles.reject}
                  onClick={() => updateRequest(request.id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}

        <p>{message}</p>
      </div>
    )
  }

  if (status === 'approved') {
    return (
      <>
        <div style={styles.userBar}>
          <span>Welcome, {user.email}</span>
          <button style={styles.button} onClick={logout}>Logout</button>
        </div>
        <App />
      </>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>CivicPulse AI</h1>

        {status === 'pending' ? (
          <>
            <h2>Request Pending</h2>
            <p>Your access request is waiting for admin approval.</p>
          </>
        ) : status === 'rejected' ? (
          <>
            <h2>Access Rejected</h2>
            <p>Your access request was rejected by the administrator.</p>
          </>
        ) : (
          <>
            <h2>Request Access</h2>
            <p>You need administrator approval to access CivicPulse.</p>
            <button style={styles.button} onClick={requestAccess}>
              Request Access
            </button>
          </>
        )}

        <p>{message}</p>
        <button style={styles.link} onClick={logout}>Logout</button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#0b1220',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    padding: '20px'
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '30px',
    background: '#172235',
    borderRadius: '14px',
    textAlign: 'center'
  },
  input: {
    width: '100%',
    padding: '13px',
    margin: '10px 0',
    boxSizing: 'border-box',
    borderRadius: '7px',
    border: '1px solid #475569',
    background: '#0f172a',
    color: 'white'
  },
  button: {
    padding: '11px 18px',
    background: '#0284c7',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer'
  },
  link: {
    display: 'block',
    margin: '18px auto 0',
    background: 'none',
    border: 'none',
    color: '#38bdf8',
    cursor: 'pointer'
  },
  adminPage: {
    minHeight: '100vh',
    padding: '30px',
    background: '#0b1220',
    color: 'white',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  request: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    padding: '16px',
    margin: '12px 0',
    background: '#172235',
    borderRadius: '10px'
  },
  approve: {
    padding: '9px',
    margin: '4px',
    background: '#15803d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  reject: {
    padding: '9px',
    margin: '4px',
    background: '#b91c1c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  userBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: '#172235',
    color: 'white'
  }
}

export default AuthGate
