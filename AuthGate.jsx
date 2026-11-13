
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import App from './App'

function AuthGate() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function refreshUser() {
      const { data } = await supabase.auth.getSession()

      if (mounted) {
        setUser(data.session?.user ?? null)
        setLoading(false)
      }
    }

    refreshUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    const interval = setInterval(refreshUser, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <h2>Loading...</h2>
  }

  if (!user) {
    return <h2>Please login to continue.</h2>
  }

  return <App />
}

export default AuthGate
