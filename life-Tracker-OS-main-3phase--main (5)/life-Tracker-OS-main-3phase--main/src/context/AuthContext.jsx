import { useEffect, useMemo, useState } from 'react'
import {
  getStoredSession,
  initializeGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
} from '../services/authService'
import { AuthContext } from './appContextCore'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let mounted = true

    async function boot() {
      try {
        setIsLoading(true)
        setAuthError('')

        const session = getStoredSession()
        if (session?.user && mounted) {
          setUser(session.user)
        }

        if (mounted) {
          setIsAuthReady(true)
        }

        initializeGoogleAuth().catch((googleError) => {
          console.error('Google auth script initialization failed:', googleError)
          if (mounted) {
            setAuthError(
              (prev) =>
                prev ||
                googleError.message ||
                'Failed to initialize Google auth'
            )
          }
        })
      } catch (error) {
        console.error('Auth initialization failed:', error)
        if (mounted) {
          setAuthError(error.message || 'Failed to initialize Google auth')
          setIsAuthReady(true)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    boot()

    return () => {
      mounted = false
    }
  }, [])

  const login = async () => {
    try {
      setIsLoading(true)
      setAuthError('')

      const session = await signInWithGoogle()
      if (session?.user) {
        setUser(session.user)
      }

      return session?.user ?? null
    } catch (error) {
      console.error('Login failed:', error)
      setAuthError(error.message || 'Google sign-in failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    signOutGoogle()
    setUser(null)
    setAuthError('')
    localStorage.removeItem('lifeos_drive_folder_id')
    localStorage.removeItem('lifeos_drive_bills_folder_id')
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isLoading,
      isAuthReady,
      authError,
      isAuthenticated: !!user,
      setAuthError,
    }),
    [user, isLoading, isAuthReady, authError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
