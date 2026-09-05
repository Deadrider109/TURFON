import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { supabase } from "../supabase"

function ProtectedRoute({ children }) {
  const location = useLocation()

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(session)
      setLoading(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return

      setSession(currentSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div
        className="
          flex min-h-screen items-center justify-center
          bg-[#F6F7F3]
          text-[#123B27]
          dark:bg-[#0B110E]
          dark:text-white
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              h-5 w-5 animate-spin rounded-full
              border-2 border-[#123B27]/20
              border-t-[#123B27]
              dark:border-white/20
              dark:border-t-[#B7E600]
            "
          />

          <span className="text-sm font-medium">
            Checking session...
          </span>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return children
}

export default ProtectedRoute